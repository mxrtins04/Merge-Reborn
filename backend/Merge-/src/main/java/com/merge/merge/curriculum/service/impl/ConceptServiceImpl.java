package com.merge.merge.curriculum.service.impl;

import com.merge.merge.curriculum.dto.NextConceptResult;
import com.merge.merge.curriculum.models.Concept;
import com.merge.merge.curriculum.models.PredefinedContentRef;
import com.merge.merge.curriculum.repository.ConceptRepository;
import com.merge.merge.curriculum.service.ConceptService;
import com.merge.merge.curriculum.service.ResourceService;
import com.merge.merge.identity.models.Student;
import com.merge.merge.identity.service.StudentService;
import com.merge.merge.shared.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class ConceptServiceImpl implements ConceptService {

    private final ConceptRepository conceptRepository;
    private final ResourceService resourceService;
    private final StudentService studentService;

    public ConceptServiceImpl(ConceptRepository conceptRepository, ResourceService resourceService, StudentService studentService) {
        this.conceptRepository = conceptRepository;
        this.resourceService = resourceService;
        this.studentService = studentService;
    }

    @Override
    public Concept create(UUID stageId, PredefinedContentRef content) {
        List<Concept> existing = conceptRepository.findByStageId(stageId);
        int maxOrder = existing.stream()
                .mapToInt(Concept::getOrder)
                .max()
                .orElse(0);

        Concept concept = new Concept(stageId, content, maxOrder + 1);
        return conceptRepository.save(concept);
    }

    @Override
    public Concept create(UUID stageId, PredefinedContentRef content, int order) {
        Concept concept = new Concept(stageId, content, order);
        return conceptRepository.save(concept);
    }

    @Override
    public Concept getById(UUID conceptId) {
        return conceptRepository.findById(conceptId)
                .orElseThrow(() -> ResourceNotFoundException.forId("Concept", conceptId));
    }

    @Override
    public List<Concept> listByStageId(UUID stageId) {
        return conceptRepository.findByStageId(stageId);
    }

    @Override
    public void delete(UUID conceptId) {
        long resourceCount = resourceService.countByConceptId(conceptId);
        if (resourceCount > 0) {
            throw new IllegalStateException("Cannot delete Concept with " + resourceCount + " dependent Resources");
        }
        conceptRepository.deleteById(conceptId);
    }

    @Override
    public long countByStageId(UUID stageId) {
        return conceptRepository.countByStageId(stageId);
    }

    @Override
    public NextConceptResult getNextConcept(UUID studentId) {
        Student student = studentService.getById(studentId);
        UUID currentStageId = student.getStageId();
        UUID lastCompletedId = student.getLastCompletedConceptId();

        List<Concept> stageConcepts = conceptRepository.findByStageId(currentStageId).stream()
                .sorted(Comparator.comparingInt(Concept::getOrder))
                .toList();

        if (stageConcepts.isEmpty()) {
            return new NextConceptResult(NextConceptResult.NextConceptStatus.NO_CONCEPTS_CONFIGURED, null);
        }

        if (lastCompletedId == null) {
            return new NextConceptResult(NextConceptResult.NextConceptStatus.PRESENT, stageConcepts.get(0));
        }

        int index = -1;
        for (int i = 0; i < stageConcepts.size(); i++) {
            if (stageConcepts.get(i).getId().equals(lastCompletedId)) {
                index = i;
                break;
            }
        }

        if (index == -1) {
            // Completed concept not in current stage (student was promoted). Return first concept.
            return new NextConceptResult(NextConceptResult.NextConceptStatus.PRESENT, stageConcepts.get(0));
        }

        if (index + 1 < stageConcepts.size()) {
            return new NextConceptResult(NextConceptResult.NextConceptStatus.PRESENT, stageConcepts.get(index + 1));
        } else {
            return new NextConceptResult(NextConceptResult.NextConceptStatus.STAGE_COMPLETE, null);
        }
    }
}
