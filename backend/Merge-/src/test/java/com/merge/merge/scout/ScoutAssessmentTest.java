package com.merge.merge.scout;

import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.curriculum.models.Stage;
import com.merge.merge.curriculum.service.StageService;
import com.merge.merge.identity.models.Student;
import com.merge.merge.identity.repository.StudentRepository;
import com.merge.merge.identity.service.StudentService;
import com.merge.merge.scout.models.ScoutAssessment;
import com.merge.merge.scout.models.PersonalisationProfile;
import com.merge.merge.scout.repository.ScoutAssessmentRepository;
import com.merge.merge.scout.repository.PersonalisationProfileRepository;
import com.merge.merge.scout.service.ScoutService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class ScoutAssessmentTest {

    @Autowired
    private ScoutService scoutService;

    @Autowired
    private ScoutAssessmentRepository assessmentRepository;

    @Autowired
    private PersonalisationProfileRepository profileRepository;

    @Autowired
    private StudentService studentService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StageService stageService;

    @Autowired
    private com.merge.merge.curriculum.repository.StageRepository stageRepository;

    @Autowired
    private com.merge.merge.curriculum.repository.ConceptRepository conceptRepository;

    private Student student;
    private Stage scoutStage;
    private Stage cadetStage;

    @BeforeEach
    void setUp() {
        assessmentRepository.deleteAll();
        profileRepository.deleteAll();
        studentRepository.deleteAll();
        conceptRepository.deleteAll();
        stageRepository.deleteAll();

        scoutStage = stageService.create("Scout Stage", 0);
        cadetStage = stageService.create("Cadet Level 1", 50);

        student = studentService.create("Test Student", "details", scoutStage.getId());
    }

    @AfterEach
    void tearDown() {
        assessmentRepository.deleteAll();
        profileRepository.deleteAll();
        studentRepository.deleteAll();
        conceptRepository.deleteAll();
        stageRepository.deleteAll();
    }

    @Test
    void testCompleteScoutAssessmentFlow() {
        ScoutAssessment assessment = scoutService.startOrGetAssessment(student.getId());
        assertThat(assessment.isCompleted()).isFalse();

        scoutService.submitBackgroundAnswers(student.getId(), Map.of("q1", "VISUAL preference", "q2", "intrinsic learner"));
        scoutService.submitConceptualAnswers(student.getId(), Map.of("q3", "oop concepts"));
        scoutService.submitBaselineCode(student.getId(), "public class Baseline {}");

        PersonalisationProfile profile = scoutService.completeScoutAssessment(student.getId());

        assertThat(profile).isNotNull();
        assertThat(profile.getThinkingStyle()).isEqualTo("ANALYTICAL");

        Student updated = studentService.getById(student.getId());
        assertThat(updated.getStageId()).isEqualTo(cadetStage.getId());
        assertThat(updated.getXp()).isEqualTo(0);
    }

    @Test
    void testLayer1BackgroundQuestions() {
        scoutService.submitBackgroundAnswers(student.getId(), Map.of("experience", "none", "motivation", "career change"));
        ScoutAssessment assessment = assessmentRepository.findByStudentId(student.getId()).orElseThrow();
        assertThat(assessment.getBackgroundAnswers()).containsEntry("experience", "none");
        assertThat(assessment.getBackgroundAnswers()).containsEntry("motivation", "career change");
    }

    @Test
    void testLayer2ConceptualProblems() {
        scoutService.submitConceptualAnswers(student.getId(), Map.of("c1", "polymorphism answer", "c2", "recursion answer"));
        ScoutAssessment assessment = assessmentRepository.findByStudentId(student.getId()).orElseThrow();
        assertThat(assessment.getConceptualAnswers()).containsEntry("c1", "polymorphism answer");
        assertThat(assessment.getConceptualAnswers()).containsEntry("c2", "recursion answer");
    }

    @Test
    void testLayer3BaselineCodingTask() {
        scoutService.submitBaselineCode(student.getId(), "class Solution {}");
        ScoutAssessment assessment = assessmentRepository.findByStudentId(student.getId()).orElseThrow();
        assertThat(assessment.getBaselineCode()).isEqualTo("class Solution {}");
    }

    @Test
    void testZeroXpAwarded() {
        // Complete the entire flow and verify XP remains 0
        scoutService.submitBackgroundAnswers(student.getId(), Map.of("q1", "a"));
        scoutService.submitConceptualAnswers(student.getId(), Map.of("q2", "b"));
        scoutService.submitBaselineCode(student.getId(), "code");

        scoutService.completeScoutAssessment(student.getId());

        Student updated = studentService.getById(student.getId());
        assertThat(updated.getXp()).isEqualTo(0);
    }

    @Test
    void testPersonalisationProfileOutputStructure() {
        scoutService.submitBackgroundAnswers(student.getId(), Map.of("q1", "a"));
        scoutService.submitConceptualAnswers(student.getId(), Map.of("q2", "b"));
        scoutService.submitBaselineCode(student.getId(), "code");

        PersonalisationProfile profile = scoutService.completeScoutAssessment(student.getId());

        assertThat(profile.getThinkingStyle()).isNotNull();
        assertThat(profile.getMotivationType()).isNotNull();
        assertThat(profile.getPriorExposure()).isNotNull();
        assertThat(profile.getLearningApproach()).isNotNull();
    }
}
