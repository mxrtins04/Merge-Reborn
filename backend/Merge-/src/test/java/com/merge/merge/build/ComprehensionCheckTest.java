package com.merge.merge.build;

import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.build.models.ComprehensionCheck;
import com.merge.merge.build.repository.ComprehensionCheckRepository;
import com.merge.merge.build.web.ComprehensionCheckController;
import com.merge.merge.identity.models.Student;
import com.merge.merge.identity.repository.StudentRepository;
import com.merge.merge.identity.service.StudentService;
import com.merge.merge.curriculum.models.Stage;
import com.merge.merge.curriculum.service.StageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
public class ComprehensionCheckTest {

    @Autowired
    private ComprehensionCheckRepository checkRepository;

    @Autowired
    private ComprehensionCheckController checkController;

    @Autowired
    private StudentService studentService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StageService stageService;

    @Autowired
    private com.merge.merge.identity.service.CredentialService credentialService;

    private Student student;
    private UsernamePasswordAuthenticationToken auth;

    @BeforeEach
    void setUp() {
        checkRepository.deleteAll();
        studentRepository.deleteAll();

        Stage stage = stageService.create("Cadet Stage", 50);
        student = studentService.create("Adewole", "details", stage.getId());
        credentialService.storeToken(student.getId(), com.merge.merge.identity.service.CredentialService.TokenType.GEMINI, "mock");

        auth = new UsernamePasswordAuthenticationToken(student.getId(), null, List.of());
    }

    @AfterEach
    void tearDown() {
        checkRepository.deleteAll();
        studentRepository.deleteAll();
    }

    @Test
    void testDeadlineAsserted_WithinDeadline() {
        ComprehensionCheck check = ComprehensionCheck.builder()
                .id(UUID.randomUUID())
                .studentId(student.getId())
                .buildId(UUID.randomUUID())
                .isLevelBuild(false)
                .questions("Q1")
                .expectedAnswers("A1")
                .passed(false)
                .serverDeadline(Instant.now().plusSeconds(10)) // 10 seconds deadline
                .createdAt(Instant.now())
                .build();
        checkRepository.save(check);

        ResponseEntity<?> response = checkController.submitCheck(
                check.getId(),
                new ComprehensionCheckController.SubmitCheckRequest("answers"),
                auth
        );

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isInstanceOf(ComprehensionCheckController.SubmitCheckResponse.class);
        assertThat(((ComprehensionCheckController.SubmitCheckResponse) response.getBody()).passed()).isTrue();
    }

    @Test
    void testDeadlineAsserted_MissedDeadline() {
        ComprehensionCheck check = ComprehensionCheck.builder()
                .id(UUID.randomUUID())
                .studentId(student.getId())
                .buildId(UUID.randomUUID())
                .isLevelBuild(false)
                .questions("Q1")
                .expectedAnswers("A1")
                .passed(false)
                .serverDeadline(Instant.now().minusSeconds(1)) // deadline already passed
                .createdAt(Instant.now())
                .build();
        checkRepository.save(check);

        ResponseEntity<?> response = checkController.submitCheck(
                check.getId(),
                new ComprehensionCheckController.SubmitCheckRequest("answers"),
                auth
        );

        assertThat(response.getStatusCode().value()).isEqualTo(400);
    }
}
