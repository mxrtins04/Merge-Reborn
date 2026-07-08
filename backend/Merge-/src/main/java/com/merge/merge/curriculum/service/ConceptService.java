package com.merge.merge.curriculum.service;

import com.merge.merge.curriculum.models.Concept;
import com.merge.merge.curriculum.models.PredefinedContentRef;

import java.util.UUID;

public interface ConceptService {
    Concept create(UUID stageId, PredefinedContentRef content);
    Concept getById(UUID conceptId);
    void delete(UUID conceptId);
    long countByStageId(UUID stageId);
}
