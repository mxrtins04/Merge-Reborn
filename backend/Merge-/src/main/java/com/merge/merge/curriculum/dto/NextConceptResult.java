package com.merge.merge.curriculum.dto;

import com.merge.merge.curriculum.models.Concept;

public record NextConceptResult(
        NextConceptStatus status,
        Concept concept
) {
    public enum NextConceptStatus {
        PRESENT,
        STAGE_COMPLETE,
        NO_CONCEPTS_CONFIGURED
    }
}
