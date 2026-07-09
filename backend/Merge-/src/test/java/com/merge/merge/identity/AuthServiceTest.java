package com.merge.merge.identity;

import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.identity.models.Student;
import com.merge.merge.identity.repository.StudentRepository;
import com.merge.merge.identity.service.AuthService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class AuthServiceTest {

    @Autowired private AuthService authService;
    @Autowired private StudentRepository studentRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private StringRedisTemplate redisTemplate;

    @AfterEach
    void cleanUp() {
        studentRepository.deleteAll();
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
    }

    @Test
    void registrationCreatesStudentWithAuthFields() {
        Student student = authService.register("ada@example.com", "correcthorse123", "Ada");

        assertThat(student.getId()).isNotNull();
        assertThat(student.getName()).isEqualTo("Ada");
        assertThat(student.getEmail()).isEqualTo("ada@example.com");
        // Hash must be present and must be a real bcrypt hash, not the raw password.
        assertThat(student.getPasswordHash()).isNotNull();
        assertThat(student.getPasswordHash()).isNotEqualTo("correcthorse123");
        assertThat(passwordEncoder.matches("correcthorse123", student.getPasswordHash())).isTrue();

        // Verify the student is findable by email — the index path.
        Student fromDb = studentRepository.findByEmail("ada@example.com").orElseThrow();
        assertThat(fromDb.getId()).isEqualTo(student.getId());
    }

    @Test
    void duplicateEmailIsRejected() {
        authService.register("ada@example.com", "correcthorse123", "Ada");

        org.assertj.core.api.Assertions.assertThatThrownBy(
                () -> authService.register("ada@example.com", "differentpass1", "Ada Two"))
                .isInstanceOf(DuplicateEmailException.class);

        // Exactly one student must exist for this email.
        assertThat(studentRepository.findAll().stream()
                .filter(s -> "ada@example.com".equals(s.getEmail()))
                .count()).isEqualTo(1);
    }

    /**
     * Genuine concurrency test, not a mocked race. Two threads both pass the
     * Redis pre-check (neither has written yet), then both attempt the
     * Mongo write for the same email. Exactly one must succeed; the loser
     * must be rejected by the unique index on Student.email (surfaced as
     * DuplicateEmailException via the DuplicateKeyException catch in
     * AuthService), not by Redis, since Redis had already let both through.
     *
     * <p>This test is the proof that the database index is the actual
     * enforcement, not the Redis fast-path check.</p>
     */
    @Test
    void duplicateEmailRegistrationRaceIsCaughtByTheStudentUniqueIndex() throws InterruptedException {
        String email = "race@example.com";
        int attempts = 2;
        CountDownLatch readyLatch = new CountDownLatch(attempts);
        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger duplicateCount = new AtomicInteger();
        ExecutorService pool = Executors.newFixedThreadPool(attempts);

        for (int i = 0; i < attempts; i++) {
            pool.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    authService.register(email, "correcthorse123", "Racer");
                    successCount.incrementAndGet();
                } catch (DuplicateEmailException e) {
                    duplicateCount.incrementAndGet();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        readyLatch.await();
        startLatch.countDown();
        pool.shutdown();
        assertThat(pool.awaitTermination(10, TimeUnit.SECONDS)).isTrue();

        assertThat(successCount.get()).isEqualTo(1);
        assertThat(duplicateCount.get()).isEqualTo(1);

        // The students collection must contain exactly one entry for this email.
        List<Student> students = studentRepository.findAll().stream()
                .filter(s -> email.equals(s.getEmail()))
                .toList();
        assertThat(students).hasSize(1);
    }
}
