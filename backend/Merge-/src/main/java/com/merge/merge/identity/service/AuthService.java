package com.merge.merge.identity.service;

import com.merge.merge.identity.DuplicateEmailException;
import com.merge.merge.identity.models.Student;
import com.merge.merge.identity.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String REGISTERED_EMAILS_KEY = "registered_emails";

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    /**
     * Registers a new student in a single write to the students collection.
     * Email and passwordHash are stored directly on Student.
     *
     * <p>The Redis membership check below is a fast-path optimisation only,
     * rejecting an obvious duplicate before paying for a Mongo write. It is
     * NOT the correctness guarantee: two near-simultaneous requests for the
     * same email can both pass the Redis check before either has written
     * anything, since neither has added the email to the set yet. The unique
     * index on Student.email, enforced by MongoDB itself, is the actual
     * enforcement; the DuplicateKeyException catch below is what a genuine
     * race resolves to. Do not read the Redis check as sufficient on its own
     * anywhere this method is called from.</p>
     *
     * <p>No @Transactional needed: this is a single-document write. A single
     * MongoDB save is atomic by definition — there is no second document that
     * could end up in a half-written state.</p>
     */
    public Student register(String email, String rawPassword, String name) {
        if (Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(REGISTERED_EMAILS_KEY, email))) {
            throw new DuplicateEmailException(email);
        }

        Student student = new Student(UUID.randomUUID(), email,
                passwordEncoder.encode(rawPassword), name, null, null);

        try {
            studentRepository.save(student);
        } catch (DuplicateKeyException e) {
            throw new DuplicateEmailException(email);
        }

        // Redis set updated after the DB write succeeds. If this line fails,
        // the DB transaction already committed, so the student exists. The
        // next registration attempt for this email will be caught by the
        // unique index, not the Redis check — that's correct and expected.
        redisTemplate.opsForSet().add(REGISTERED_EMAILS_KEY, email);
        return student;
    }
}
