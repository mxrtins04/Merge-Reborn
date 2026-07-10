package com.merge.merge.curriculum;

import com.merge.merge.curriculum.models.Concept;
import com.merge.merge.curriculum.repository.ConceptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class ConceptOrderInitializer {

    private final ConceptRepository conceptRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void initializeConceptOrders() {
        List<Concept> allConcepts = conceptRepository.findAll();
        Map<UUID, List<Concept>> groupedByStage = allConcepts.stream()
                .collect(Collectors.groupingBy(Concept::getStageId));

        for (Map.Entry<UUID, List<Concept>> entry : groupedByStage.entrySet()) {
            UUID stageId = entry.getKey();
            List<Concept> concepts = entry.getValue();

            // Check if any concept has order == 0 (default/unset) or if there are duplicate orders
            boolean needsReorder = concepts.stream().anyMatch(c -> c.getOrder() == 0)
                    || concepts.stream().map(Concept::getOrder).distinct().count() < concepts.size();

            if (needsReorder) {
                log.info("Backfilling concept orders for stageId: {}", stageId);
                // Sort them deterministically by current order first, then ID
                concepts.sort(Comparator.comparingInt(Concept::getOrder)
                        .thenComparing(Concept::getId));

                for (int i = 0; i < concepts.size(); i++) {
                    Concept c = concepts.get(i);
                    c.setOrder(i + 1); // 1-indexed order
                    conceptRepository.save(c);
                }
                log.info("Successfully ordered {} concepts for stageId: {}", concepts.size(), stageId);
            }
        }
    }
}
