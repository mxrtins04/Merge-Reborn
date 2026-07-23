package com.merge.merge.scout.repository;

import com.merge.merge.scout.models.ScoutAssessment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.UUID;

public interface ScoutAssessmentRepository extends MongoRepository<ScoutAssessment, UUID> {
    Optional<ScoutAssessment> findByStudentId(UUID studentId);
}
