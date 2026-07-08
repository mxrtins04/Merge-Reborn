package com.merge.merge.curriculum;

import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.curriculum.models.Concept;
import com.merge.merge.curriculum.models.PredefinedContentRef;
import com.merge.merge.curriculum.repository.ConceptRepository;
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
class ConceptPersistenceTest {

    @Autowired
    private ConceptRepository conceptRepository;

    @AfterEach
    void cleanUp() {
        conceptRepository.deleteAll();
    }

    @Test
    void predefinedContentRefRoundTripsCorrectly() {
        UUID stageId = UUID.randomUUID();
        PredefinedContentRef content = new PredefinedContentRef(
                "Incident 123",
                "Learn Recursion",
                "Base case is important"
        );
        Concept concept = new Concept(stageId, content);
        
        Concept saved = conceptRepository.save(concept);
        Concept retrieved = conceptRepository.findById(saved.getId()).orElseThrow();

        assertThat(retrieved.getPredefinedContentRef()).isNotNull();
        assertThat(retrieved.getPredefinedContentRef().getFailureScenario()).isEqualTo("Incident 123");
        assertThat(retrieved.getPredefinedContentRef().getTeachingObjective()).isEqualTo("Learn Recursion");
        assertThat(retrieved.getPredefinedContentRef().getCoreContent()).isEqualTo("Base case is important");
    }
}
