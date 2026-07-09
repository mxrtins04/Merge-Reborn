package com.merge.merge.practice.repository;

import com.merge.merge.practice.model.Drill;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DrillRepository extends MongoRepository<Drill, UUID> {

    /**
     * Finds a Drill by its idempotency key. Used by the submit endpoint to detect
     * and short-circuit duplicate submissions.
     */
    Optional<Drill> findByIdempotencyKey(String idempotencyKey);
}
