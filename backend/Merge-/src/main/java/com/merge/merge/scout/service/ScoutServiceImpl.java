package com.merge.merge.scout.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.merge.merge.scout.models.ScoutAssessment;
import com.merge.merge.scout.models.PersonalisationProfile;
import com.merge.merge.scout.repository.ScoutAssessmentRepository;
import com.merge.merge.scout.repository.PersonalisationProfileRepository;
import com.merge.merge.identity.service.StudentService;
import com.merge.merge.curriculum.service.StageService;
import com.merge.merge.curriculum.models.Stage;
import com.merge.merge.integration.gemini.GeminiClient;
import com.merge.merge.identity.service.CredentialService;
import com.merge.merge.identity.MissingCredentialException;
import com.merge.merge.shared.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScoutServiceImpl implements ScoutService {

    private final ScoutAssessmentRepository assessmentRepository;
    private final PersonalisationProfileRepository profileRepository;
    private final StudentService studentService;
    private final StageService stageService;
    private final GeminiClient geminiClient;
    private final CredentialService credentialService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ScoutAssessment startOrGetAssessment(UUID studentId) {
        return assessmentRepository.findByStudentId(studentId)
                .orElseGet(() -> assessmentRepository.save(
                        ScoutAssessment.builder()
                                .id(UUID.randomUUID())
                                .studentId(studentId)
                                .completed(false)
                                .build()
                ));
    }

    @Override
    public ScoutAssessment submitBackgroundAnswers(UUID studentId, Map<String, String> answers) {
        ScoutAssessment assessment = startOrGetAssessment(studentId);
        assessment.setBackgroundAnswers(answers);
        return assessmentRepository.save(assessment);
    }

    @Override
    public ScoutAssessment submitConceptualAnswers(UUID studentId, Map<String, String> answers) {
        ScoutAssessment assessment = startOrGetAssessment(studentId);
        assessment.setConceptualAnswers(answers);
        return assessmentRepository.save(assessment);
    }

    @Override
    public ScoutAssessment submitBaselineCode(UUID studentId, String code) {
        ScoutAssessment assessment = startOrGetAssessment(studentId);
        assessment.setBaselineCode(code);
        return assessmentRepository.save(assessment);
    }

    @Override
    public PersonalisationProfile completeScoutAssessment(UUID studentId) {
        ScoutAssessment assessment = assessmentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Scout assessment not found for student: " + studentId));

        if (assessment.getBackgroundAnswers() == null || assessment.getConceptualAnswers() == null || assessment.getBaselineCode() == null) {
            throw new IllegalStateException("Cannot complete assessment: not all layers are submitted.");
        }

        String apiKey;
        try {
            apiKey = credentialService.getDecryptedToken(studentId, CredentialService.TokenType.GEMINI);
        } catch (Exception e) {
            apiKey = "mock";
        }

        String prompt = String.format(
                """
                Analyze the student's background assessment and conceptual answers to classify their personalization profile.

                Background Answers:
                %s

                Conceptual Answers:
                %s

                Baseline Code:
                %s

                Classify the student into these four categories:
                1. thinkingStyle: VISUAL, ANALYTICAL, or PRACTICAL
                2. motivationType: INTRINSIC or GOAL_ORIENTED
                3. priorExposure: NONE, SELF_TAUGHT, BOOTCAMP, or ACADEMIC
                4. learningApproach: BOTTOM_UP or TOP_DOWN

                Respond with EXACTLY this JSON structure:
                {
                  "thinkingStyle": "<value>",
                  "motivationType": "<value>",
                  "priorExposure": "<value>",
                  "learningApproach": "<value>"
                }
                """,
                assessment.getBackgroundAnswers().toString(),
                assessment.getConceptualAnswers().toString(),
                assessment.getBaselineCode()
        );

        String rawResult = geminiClient.generate(prompt, apiKey);
        String jsonResult = sanitizeJson(rawResult);

        String thinkingStyle = "ANALYTICAL";
        String motivationType = "INTRINSIC";
        String priorExposure = "NONE";
        String learningApproach = "BOTTOM_UP";

        try {
            Map<String, String> parsed = objectMapper.readValue(jsonResult, new TypeReference<Map<String, String>>() {});
            if (parsed.containsKey("thinkingStyle")) thinkingStyle = parsed.get("thinkingStyle");
            if (parsed.containsKey("motivationType")) motivationType = parsed.get("motivationType");
            if (parsed.containsKey("priorExposure")) priorExposure = parsed.get("priorExposure");
            if (parsed.containsKey("learningApproach")) learningApproach = parsed.get("learningApproach");
        } catch (Exception e) {
            log.warn("Failed to parse Gemini personalization profile JSON, using fallbacks. Raw response: {}", rawResult, e);
        }

        PersonalisationProfile profile = profileRepository.findByStudentId(studentId)
                .orElse(PersonalisationProfile.builder()
                        .id(UUID.randomUUID())
                        .studentId(studentId)
                        .build());

        profile.setThinkingStyle(thinkingStyle);
        profile.setMotivationType(motivationType);
        profile.setPriorExposure(priorExposure);
        profile.setLearningApproach(learningApproach);

        profileRepository.save(profile);

        assessment.setCompleted(true);
        assessmentRepository.save(assessment);

        // Advance to Cadet stage
        Stage cadetStage = stageService.listAll().stream()
                .filter(s -> s.getName().toLowerCase().contains("cadet"))
                .findFirst()
                .orElse(null);
        if (cadetStage != null) {
            studentService.advanceToStage(studentId, cadetStage.getId());
        }

        log.info("Completed Scout Assessment for student {}. PersonalisationProfile created: {}", studentId, profile.getId());
        return profile;
    }

    private String sanitizeJson(String json) {
        if (json == null) return "{}";
        json = json.trim();
        if (json.startsWith("```json")) {
            json = json.substring(7);
        } else if (json.startsWith("```")) {
            json = json.substring(3);
        }
        if (json.endsWith("```")) {
            json = json.substring(0, json.length() - 3);
        }
        return json.trim();
    }
}
