package com.merge.merge.curriculum;

import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.curriculum.models.Concept;
import com.merge.merge.curriculum.models.PredefinedContentRef;
import com.merge.merge.curriculum.models.Stage;
import com.merge.merge.curriculum.repository.ConceptRepository;
import com.merge.merge.curriculum.repository.ResourceRepository;
import com.merge.merge.curriculum.repository.StageRepository;
import com.merge.merge.curriculum.service.ConceptService;
import com.merge.merge.curriculum.service.ResourceService;
import com.merge.merge.curriculum.service.StageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
class CurriculumDeletionTest {

    @Autowired
    private StageService stageService;

    @Autowired
    private ConceptService conceptService;

    @Autowired
    private ResourceService resourceService;

    @Autowired
    private StageRepository stageRepository;

    @Autowired
    private ConceptRepository conceptRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @AfterEach
    void cleanUp() {
        resourceRepository.deleteAll();
        conceptRepository.deleteAll();
        stageRepository.deleteAll();
    }

    @Test
    void cannotDeleteStageWithExistingConcepts() {
        Stage stage = stageService.create("Stage 1", 100);
        PredefinedContentRef content = new PredefinedContentRef("Fail", "Goal", "Content");
        conceptService.create(stage.getId(), content);

        assertThatThrownBy(() -> stageService.delete(stage.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Concepts");
    }

    @Test
    void cannotDeleteConceptWithExistingResources() {
        Stage stage = stageService.create("Stage 1", 100);
        PredefinedContentRef content = new PredefinedContentRef("Fail", "Goal", "Content");
        Concept concept = conceptService.create(stage.getId(), content);
        resourceService.create(concept.getId(), "Link", "Title", "http://example.com");

        assertThatThrownBy(() -> conceptService.delete(concept.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Resources");
    }
}
