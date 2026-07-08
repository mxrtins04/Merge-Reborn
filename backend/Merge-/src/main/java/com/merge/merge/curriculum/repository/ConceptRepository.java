package com.merge.merge.curriculum.repository;

import com.merge.merge.curriculum.models.Concept;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.UUID;

public interface ConceptRepository extends MongoRepository<Concept, UUID> {
    long countByStageId(UUID stageId);
}
