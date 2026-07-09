package com.merge.merge.remediation;

import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.ai.model.Instructor;
import com.merge.merge.ai.model.InstructorStatus;
import com.merge.merge.ai.repository.InstructorRepository;
import com.merge.merge.ai.service.InstructorService;
import com.merge.merge.identity.service.ContextService;
import com.merge.merge.integration.gemini.GeminiClient;
import com.merge.merge.remediation.models.Mission;
import com.merge.merge.remediation.repository.MissionRepository;
import com.merge.merge.remediation.service.RemediationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class RemediationServiceTest {

    @Autowired
    private RemediationService remediationService;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private InstructorRepository instructorRepository;

    @Autowired
    private InstructorService instructorService;

    @Autowired
    private ContextService contextService;

    @MockitoBean
    private GeminiClient geminiClient;

    @BeforeEach
    void setUp() {
        missionRepository.deleteAll();
        instructorRepository.deleteAll();
    }

    @Test
    void testFailureFlow_CreatesNewMission() {
        UUID studentId = UUID.randomUUID();
        UUID conceptId = UUID.randomUUID();
        contextService.createForStudent(studentId);

        // Mock Gemini response for failure flow
        String mockResponse = "[\n" +
                "  {\n" +
                "    \"painPointDescription\": \"Null reference exception\",\n" +
                "    \"matchedMissionId\": null,\n" +
                "    \"conceptAndContext\": \"Always initialize objects before usage.\"\n" +
                "  }\n" +
                "]";
        when(geminiClient.generate(anyString())).thenReturn(mockResponse);

        Map<String, Object> attemptData = new HashMap<>();
        attemptData.put("question", "What is 2+2?");
        attemptData.put("givenAnswer", "5");
        attemptData.put("correctAnswer", "4");
        attemptData.put("feedback", "Incorrect math calculation.");

        // Trigger failure flow
        remediationService.handleFailure(studentId, conceptId, "DRILL", attemptData);

        // Find queued job
        Instructor job = instructorRepository.findAll().stream()
                .filter(j -> j.getStatus() == InstructorStatus.QUEUED)
                .findFirst()
                .orElseThrow(() -> new AssertionError("No queued job found"));

        // Process job
        instructorService.processJob(job.getId());

        // Verify Mission is created
        List<Mission> missions = missionRepository.findByStudentIdAndConceptIdAndPassed(studentId, conceptId, false);
        assertThat(missions).hasSize(1);
        Mission mission = missions.get(0);
        assertThat(mission.getPainPointDescription()).isEqualTo("Null reference exception");
        assertThat(mission.getConceptAndContext()).isEqualTo("Always initialize objects before usage.");
        assertThat(mission.getAttemptHistory()).hasSize(1);
        assertThat(mission.getAttemptHistory().get(0).getAttemptData()).containsEntry("givenAnswer", "5");
        assertThat(mission.isPassed()).isFalse();
    }
}
