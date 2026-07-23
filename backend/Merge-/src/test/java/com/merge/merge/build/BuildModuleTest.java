package com.merge.merge.build;

import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.ai.model.Instructor;
import com.merge.merge.ai.model.InstructorActionType;
import com.merge.merge.ai.model.InstructorStatus;
import com.merge.merge.ai.repository.InstructorRepository;
import com.merge.merge.build.models.BuildStatus;
import com.merge.merge.build.models.ConceptBuild;
import com.merge.merge.build.models.LevelBuild;
import com.merge.merge.build.repository.ConceptBuildRepository;
import com.merge.merge.build.repository.LevelBuildRepository;
import com.merge.merge.build.service.ConceptBuildService;
import com.merge.merge.build.service.LevelBuildService;
import com.merge.merge.build.service.ProgressionService;
import com.merge.merge.build.service.impl.BuildQueueWorker;
import com.merge.merge.curriculum.models.Concept;
import com.merge.merge.curriculum.models.PredefinedContentRef;
import com.merge.merge.curriculum.models.Stage;
import com.merge.merge.curriculum.repository.ConceptRepository;
import com.merge.merge.curriculum.repository.StageRepository;
import com.merge.merge.curriculum.service.ConceptService;
import com.merge.merge.curriculum.service.StageService;
import com.merge.merge.identity.models.Student;
import com.merge.merge.identity.repository.StudentRepository;
import com.merge.merge.identity.service.StudentService;
import com.merge.merge.build.models.ComprehensionCheck;
import com.merge.merge.shared.queue.RedisTaskQueue;
import com.merge.merge.shared.web.SubmissionController;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class BuildModuleTest {

    @Autowired
    private StudentService studentService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StageService stageService;

    @Autowired
    private StageRepository stageRepository;

    @Autowired
    private ConceptService conceptService;

    @Autowired
    private ConceptRepository conceptRepository;

    @Autowired
    private ConceptBuildService conceptBuildService;

    @Autowired
    private ConceptBuildRepository conceptBuildRepository;

    @Autowired
    private LevelBuildService levelBuildService;

    @Autowired
    private LevelBuildRepository levelBuildRepository;

    @Autowired
    private ProgressionService progressionService;

    @Autowired
    private InstructorRepository instructorRepository;

    @Autowired
    private SubmissionController submissionController;

    @Autowired
    private BuildQueueWorker buildQueueWorker;

    @Autowired
    private RedisTaskQueue redisTaskQueue;

    @Autowired
    private com.merge.merge.identity.service.CredentialService credentialService;

    @Autowired
    private com.merge.merge.build.repository.ComprehensionCheckRepository comprehensionCheckRepository;

    @Autowired
    private com.merge.merge.build.web.ComprehensionCheckController comprehensionCheckController;

    @Autowired
    private com.merge.merge.ai.service.InstructorService instructorService;

    @Autowired
    private com.merge.merge.project.service.ProjectService projectService;

    @Autowired
    private com.merge.merge.project.repository.ProjectRepository projectRepository;

    private Stage cadetStage;
    private Stage engineerStage;
    private Concept cadetConcept;
    private Concept engineerConcept;
    private Student student;

    @BeforeEach
    void setUp() {
        cleanupAll();

        cadetStage = stageService.create("Cadet Level 1", 50);
        engineerStage = stageService.create("Software Engineer Level 2", 150);

        PredefinedContentRef ref = new PredefinedContentRef("Fail", "Goal", "Content");
        cadetConcept = conceptService.create(cadetStage.getId(), ref);
        engineerConcept = conceptService.create(engineerStage.getId(), ref);

        student = studentService.create("Adewole", "details", cadetStage.getId());
        credentialService.storeToken(student.getId(), com.merge.merge.identity.service.CredentialService.TokenType.GEMINI, "mock");
    }

    @AfterEach
    void tearDown() {
        cleanupAll();
    }

    private void cleanupAll() {
        studentRepository.deleteAll();
        stageRepository.deleteAll();
        conceptRepository.deleteAll();
        conceptBuildRepository.deleteAll();
        levelBuildRepository.deleteAll();
        instructorRepository.deleteAll();
        comprehensionCheckRepository.deleteAll();
        projectRepository.deleteAll();
        // Delete all credentials
        com.merge.merge.identity.repository.CredentialRepository credentialRepository = 
                org.springframework.test.util.ReflectionTestUtils.getField(credentialService, "credentialRepository") != null ?
                (com.merge.merge.identity.repository.CredentialRepository) org.springframework.test.util.ReflectionTestUtils.getField(credentialService, "credentialRepository") : null;
        if (credentialRepository != null) {
            credentialRepository.deleteAll();
        }
        // Clear redis queue
        String taskId;
        while ((taskId = redisTaskQueue.dequeue("build:job:queue")) != null) {
            // Drain queue
        }
    }

    private static final String STUB_SOURCE = "public class Solution {}";
    private static final String STUB_TESTS = "public class SolutionTest { public static void main(String[] args) {} }";

    private void submitMockCheck(UUID buildId) {
        ComprehensionCheck check = comprehensionCheckRepository.findByBuildId(buildId)
                .orElseThrow(() -> new AssertionError("ComprehensionCheck not found for build " + buildId));
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(student.getId(), null, java.util.List.of());
        comprehensionCheckController.submitCheck(check.getId(), new com.merge.merge.build.web.ComprehensionCheckController.SubmitCheckRequest("answers"), auth);
    }

    private void processQueuedInstructorJobs() {
        java.util.List<Instructor> queuedJobs = instructorRepository.findAll().stream()
                .filter(j -> j.getStatus() == InstructorStatus.QUEUED)
                .collect(java.util.stream.Collectors.toList());
        for (Instructor job : queuedJobs) {
            instructorService.processJob(job.getId());
        }
    }

    @Test
    void testConceptBuildLifecycleAndXpIdempotency() {
        // 1. Create submission
        ConceptBuild cb = conceptBuildService.createConceptBuild(
                student.getId(), cadetConcept.getId(), "https://github.com/test/1",
                STUB_SOURCE, STUB_TESTS, "key-1"
        );
        assertThat(cb.getStatus()).isEqualTo(BuildStatus.QUEUED);
        assertThat(cb.getGithubLink()).isEqualTo("https://github.com/test/1");

        // 2. Background worker processing
        buildQueueWorker.processBuild(cb.getId());

        // Status should be RUNNING because comprehension check is pending
        ConceptBuild processed = conceptBuildService.getConceptBuildRecord(cb.getId());
        assertThat(processed.getStatus()).isEqualTo(BuildStatus.RUNNING);

        // Submit check to pass the build
        submitMockCheck(cb.getId());

        processed = conceptBuildService.getConceptBuildRecord(cb.getId());
        assertThat(processed.getStatus()).isEqualTo(BuildStatus.PASSED);
        assertThat(processed.isPassed()).isTrue();

        // Check XP awarded (20 XP)
        Student updatedStudent = studentService.getById(student.getId());
        assertThat(updatedStudent.getXp()).isEqualTo(20);

        // 3. Verify single-payout idempotency guard
        boolean secondAward = conceptBuildService.awardXpOnce(cb.getId(), 20);
        assertThat(secondAward).isFalse();

        updatedStudent = studentService.getById(student.getId());
        assertThat(updatedStudent.getXp()).isEqualTo(20); // No double payout
    }

    @Test
    void testLevelBuildGatingForCadetStage() {
        // Cadet stage skips cleanCode and SFIA alignment check but needs comprehension check
        LevelBuild lb = levelBuildService.createLevelBuild(
                student.getId(), cadetStage.getId(), "https://github.com/test/level-1",
                STUB_SOURCE, STUB_TESTS, "key-lb-1"
        );
        buildQueueWorker.processBuild(lb.getId());

        LevelBuild processed = levelBuildService.getLevelBuildRecord(lb.getId());
        assertThat(processed.getStatus()).isEqualTo(BuildStatus.RUNNING);

        submitMockCheck(lb.getId());

        processed = levelBuildService.getLevelBuildRecord(lb.getId());
        assertThat(processed.getStatus()).isEqualTo(BuildStatus.PASSED);
        assertThat(processed.isPassed()).isTrue();
    }

    @Test
    void testLevelBuildGatingForEngineerStage() {
        // Setup student on Engineer stage
        studentService.advanceToStage(student.getId(), engineerStage.getId());

        LevelBuild lb = levelBuildService.createLevelBuild(
                student.getId(), engineerStage.getId(), "https://github.com/test/level-2",
                STUB_SOURCE, STUB_TESTS, "key-lb-2"
        );

        buildQueueWorker.processBuild(lb.getId());

        // Process enqueued reviews
        processQueuedInstructorJobs();

        // Submit check
        submitMockCheck(lb.getId());

        LevelBuild processed = levelBuildService.getLevelBuildRecord(lb.getId());
        assertThat(processed.getStatus()).isEqualTo(BuildStatus.PASSED);
        assertThat(processed.isPassed()).isTrue();
    }

    @Test
    void testBlankGeminiKeyFailsLevelBuild() {
        // Setup student on Engineer stage
        studentService.advanceToStage(student.getId(), engineerStage.getId());

        // Store a blank Gemini token
        credentialService.storeToken(student.getId(), com.merge.merge.identity.service.CredentialService.TokenType.GEMINI, "   ");

        LevelBuild lb = levelBuildService.createLevelBuild(
                student.getId(), engineerStage.getId(), "https://github.com/test/level-2-blank",
                STUB_SOURCE, STUB_TESTS, "key-lb-blank"
        );

        org.junit.jupiter.api.Assertions.assertThrows(
                com.merge.merge.identity.MissingCredentialException.class,
                () -> buildQueueWorker.processBuild(lb.getId())
        );

        LevelBuild processed = levelBuildService.getLevelBuildRecord(lb.getId());
        assertThat(processed.getStatus()).isNotEqualTo(BuildStatus.PASSED);
    }

    @Test
    void testResubmitSameIdempotencyKeyCompletedBuildFails() {
        // Create an initial LevelBuild with terminal FAILED state
        LevelBuild lb = LevelBuild.builder()
                .id(UUID.randomUUID())
                .studentId(student.getId())
                .stageId(engineerStage.getId())
                .idempotencyKey("key-lb-terminal-test")
                .status(BuildStatus.FAILED)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        levelBuildRepository.save(lb);

        // Attempting to submit another build with the same key should throw IllegalStateException
        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalStateException.class,
                () -> levelBuildService.createLevelBuild(
                        student.getId(), engineerStage.getId(), "link",
                        STUB_SOURCE, STUB_TESTS, "key-lb-terminal-test"
                )
        );
    }

    @Test
    void testThreeConditionPromotionAndGraduation() {
        // Initial state: Student in Cadet stage (XP = 0, no ConceptBuilds, no LevelBuild)
        assertThat(progressionService.canPromote(student.getId(), cadetStage.getId())).isFalse();

        // 1. ConceptBuild passed
        ConceptBuild cb = conceptBuildService.createConceptBuild(
                student.getId(), cadetConcept.getId(), "link", STUB_SOURCE, STUB_TESTS, "key-c"
        );
        buildQueueWorker.processBuild(cb.getId());
        submitMockCheck(cb.getId());

        // 2. Award additional XP to meet the Cadet threshold (50 XP)
        studentService.awardXp(student.getId(), 30); // 20 + 30 = 50 XP

        // 3. Submit and pass LevelBuild
        LevelBuild lb = levelBuildService.createLevelBuild(
                student.getId(), cadetStage.getId(), "link", STUB_SOURCE, STUB_TESTS, "key-l"
        );
        buildQueueWorker.processBuild(lb.getId());
        submitMockCheck(lb.getId());

        // Student should now be advanced to the Engineer stage
        Student updatedStudent = studentService.getById(student.getId());
        assertThat(updatedStudent.getStageId()).isEqualTo(engineerStage.getId());

        // Now test Graduation (promoting past the final stage)
        // 1. Pass the Engineer concept
        ConceptBuild cb2 = conceptBuildService.createConceptBuild(student.getId(), engineerConcept.getId(), "link", STUB_SOURCE, STUB_TESTS, "key-c2");
        buildQueueWorker.processBuild(cb2.getId());
        submitMockCheck(cb2.getId());

        // 2. Total XP is now 170, which meets the Engineer Stage threshold of 150.
        // 3. Submit and pass Engineer LevelBuild
        LevelBuild lb2 = levelBuildService.createLevelBuild(student.getId(), engineerStage.getId(), "link", STUB_SOURCE, STUB_TESTS, "key-l2");
        buildQueueWorker.processBuild(lb2.getId());
        processQueuedInstructorJobs();
        submitMockCheck(lb2.getId());

        Student graduatedStudent = studentService.getById(student.getId());
        assertThat(graduatedStudent.isInternshipEligible()).isFalse();

        // Submit and approve project to grant internship eligibility
        com.merge.merge.project.model.Project proj = projectService.createProject(student.getId(), "given", "link", "prd");
        projectService.updateProjectStatus(proj.getId(), com.merge.merge.project.model.ProjectStatus.APPROVED, "Approved!");

        Student eligibleStudent = studentService.getById(student.getId());
        assertThat(eligibleStudent.isInternshipEligible()).isTrue();
    }

    @Test
    void testUnifiedPollingEndpoint() {
        // 1. Test polling ConceptBuild
        ConceptBuild cb = conceptBuildService.createConceptBuild(
                student.getId(), cadetConcept.getId(), "link", STUB_SOURCE, STUB_TESTS, "poll-c"
        );
        ResponseEntity<Object> responseC = submissionController.getSubmission(cb.getId());
        assertThat(responseC.getStatusCode().value()).isEqualTo(200);
        assertThat(responseC.getBody()).isInstanceOf(ConceptBuild.class);

        // 2. Test polling LevelBuild
        LevelBuild lb = levelBuildService.createLevelBuild(
                student.getId(), cadetStage.getId(), "link", STUB_SOURCE, STUB_TESTS, "poll-l"
        );
        ResponseEntity<Object> responseL = submissionController.getSubmission(lb.getId());
        assertThat(responseL.getStatusCode().value()).isEqualTo(200);
        assertThat(responseL.getBody()).isInstanceOf(LevelBuild.class);

        // 3. Test polling Instructor job
        Instructor job = Instructor.builder()
                .id(UUID.randomUUID())
                .actionType(InstructorActionType.SFIA_ALIGNMENT_EVALUATE)
                .status(InstructorStatus.QUEUED)
                .build();
        instructorRepository.save(job);
        ResponseEntity<Object> responseI = submissionController.getSubmission(job.getId());
        assertThat(responseI.getStatusCode().value()).isEqualTo(200);
        assertThat(responseI.getBody()).isInstanceOf(Instructor.class);

        // 4. Test polling unknown ID
        ResponseEntity<Object> responseUnknown = submissionController.getSubmission(UUID.randomUUID());
        assertThat(responseUnknown.getStatusCode().value()).isEqualTo(404);
    }
}
