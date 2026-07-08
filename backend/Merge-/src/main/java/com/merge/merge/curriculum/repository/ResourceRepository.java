package com.merge.merge.curriculum.repository;

import com.merge.merge.curriculum.models.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.UUID;

public interface ResourceRepository extends MongoRepository<Resource, UUID> {
    long countByConceptId(UUID conceptId);
}
