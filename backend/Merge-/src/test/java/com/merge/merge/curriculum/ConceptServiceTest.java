package com.merge.merge.curriculum;

import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.curriculum.dto.NextConceptResult;
import com.merge.merge.curriculum.models.Concept;
import com.merge.merge.curriculum.models.PredefinedContentRef;
import com.merge.merge.curriculum.repository.ConceptRepository;
import com.merge.merge.curriculum.service.ConceptService;
import com.merge.merge.identity.models.Student;
import com.merge.merge.identity.repository.StudentRepository;
import com.merge.merge.identity.service.StudentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class ConceptServiceTest {

    @Autowired
    private ConceptService conceptService;

    @Autowired
    private ConceptRepository conceptRepository;

    @Autowired
    private StudentService studentService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ConceptOrderInitializer conceptOrderInitializer;

    @AfterEach
    void cleanUp() {
        conceptRepository.deleteAll();
        studentRepository.deleteAll();
    }

    @Test
    void createAutomaticallyAssignsIncrementingOrder() {
        UUID stageId = UUID.randomUUID();
        PredefinedContentRef content = new PredefinedContentRef("scen", "obj", "core");

        Concept c1 = conceptService.create(stageId, content);
        Concept c2 = conceptService.create(stageId, content);
        Concept c3 = conceptService.create(stageId, content);

        assertThat(c1.getOrder()).isEqualTo(1);
        assertThat(c2.getOrder()).isEqualTo(2);
        assertThat(c3.getOrder()).isEqualTo(3);
    }

    @Test
    void initializerCorrectlyBackfillsUnsetOrders() {
        UUID stageId = UUID.randomUUID();
        PredefinedContentRef content = new PredefinedContentRef("scen", "obj", "core");

        // Force save concepts with order = 0 directly through repository
        Concept c1 = new Concept(stageId, content, 0);
        Concept c2 = new Concept(stageId, content, 0);
        conceptRepository.save(c1);
        conceptRepository.save(c2);

        // Run initializer
        conceptOrderInitializer.initializeConceptOrders();

        Concept updatedC1 = conceptRepository.findById(c1.getId()).orElseThrow();
        Concept updatedC2 = conceptRepository.findById(c2.getId()).orElseThrow();

        // Orders must be deterministically set to 1 and 2 based on UUID sorting
        assertThat(updatedC1.getOrder()).isNotZero();
        assertThat(updatedC2.getOrder()).isNotZero();
        assertThat(Math.min(updatedC1.getOrder(), updatedC2.getOrder())).isEqualTo(1);
        assertThat(Math.max(updatedC1.getOrder(), updatedC2.getOrder())).isEqualTo(2);
    }

    @Test
    void getNextConcept_variousScenarios() {
        UUID stageId = UUID.randomUUID();
        Student student = studentService.create("Ada", "details", stageId);

        PredefinedContentRef content = new PredefinedContentRef("scen", "obj", "core");

        // Scenario 1: No concepts configured
        NextConceptResult resNoConcepts = conceptService.getNextConcept(student.getId());
        assertThat(resNoConcepts.status()).isEqualTo(NextConceptResult.NextConceptStatus.NO_CONCEPTS_CONFIGURED);
        assertThat(resNoConcepts.concept()).isNull();

        // Configure concepts
        Concept c1 = conceptService.create(stageId, content, 1);
        Concept c2 = conceptService.create(stageId, content, 2);
        Concept c3 = conceptService.create(stageId, content, 3);

        // Scenario 2: Null lastCompletedConceptId -> lowest order concept (c1)
        NextConceptResult resNullLastCompleted = conceptService.getNextConcept(student.getId());
        assertThat(resNullLastCompleted.status()).isEqualTo(NextConceptResult.NextConceptStatus.PRESENT);
        assertThat(resNullLastCompleted.concept().getId()).isEqualTo(c1.getId());

        // Scenario 3: Completed c1 -> returns c2
        studentService.markConceptCompleted(student.getId(), c1.getId());
        NextConceptResult resAfterC1 = conceptService.getNextConcept(student.getId());
        assertThat(resAfterC1.status()).isEqualTo(NextConceptResult.NextConceptStatus.PRESENT);
        assertThat(resAfterC1.concept().getId()).isEqualTo(c2.getId());

        // Scenario 4: Completed c2 -> returns c3
        studentService.markConceptCompleted(student.getId(), c2.getId());
        NextConceptResult resAfterC2 = conceptService.getNextConcept(student.getId());
        assertThat(resAfterC2.status()).isEqualTo(NextConceptResult.NextConceptStatus.PRESENT);
        assertThat(resAfterC2.concept().getId()).isEqualTo(c3.getId());

        // Scenario 5: Completed c3 (last concept) -> STAGE_COMPLETE
        studentService.markConceptCompleted(student.getId(), c3.getId());
        NextConceptResult resAfterC3 = conceptService.getNextConcept(student.getId());
        assertThat(resAfterC3.status()).isEqualTo(NextConceptResult.NextConceptStatus.STAGE_COMPLETE);
        assertThat(resAfterC3.concept()).isNull();

        // Scenario 6: Student promoted to a new stage where they haven't completed any concept yet,
        // but lastCompletedConceptId is still c3 (from old stage) -> returns first concept of new stage (n1)
        UUID newStageId = UUID.randomUUID();
        Concept n1 = conceptService.create(newStageId, content, 1);
        Concept n2 = conceptService.create(newStageId, content, 2);

        studentService.advanceToStage(student.getId(), newStageId);

        NextConceptResult resNewStage = conceptService.getNextConcept(student.getId());
        assertThat(resNewStage.status()).isEqualTo(NextConceptResult.NextConceptStatus.PRESENT);
        assertThat(resNewStage.concept().getId()).isEqualTo(n1.getId());
    }
}
