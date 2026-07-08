package com.merge.merge.curriculum;

import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.curriculum.models.Concept;
import com.merge.merge.curriculum.models.PredefinedContentRef;
import com.merge.merge.curriculum.models.Stage;
import com.merge.merge.curriculum.repository.ConceptRepository;
import com.merge.merge.curriculum.repository.StageRepository;
import com.merge.merge.curriculum.service.ConceptService;
import com.merge.merge.curriculum.service.StageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
class StageServiceTest {

    @Autowired
    private StageService stageService;

    @Autowired
    private ConceptService conceptService;

    @Autowired
    private StageRepository stageRepository;

    @Autowired
    private ConceptRepository conceptRepository;

    @AfterEach
    void cleanUp() {
        conceptRepository.deleteAll();
        stageRepository.deleteAll();
    }

    @Test
    void getBuildPassRequiredReturnsCorrectCountLive() {
        Stage stage = stageService.create("Stage 1", 100);
        UUID stageId = stage.getId();

        assertThat(stageService.getBuildPassRequired(stageId)).isEqualTo(0);

        PredefinedContentRef content = new PredefinedContentRef("Fail", "Goal", "Content");
        Concept concept1 = conceptService.create(stageId, content);
        assertThat(stageService.getBuildPassRequired(stageId)).isEqualTo(1);

        Concept concept2 = conceptService.create(stageId, content);
        assertThat(stageService.getBuildPassRequired(stageId)).isEqualTo(2);

        conceptService.delete(concept1.getId());
        assertThat(stageService.getBuildPassRequired(stageId)).isEqualTo(1);
    }
}
