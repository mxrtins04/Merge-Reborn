package com.merge.merge.build.repository;

import com.merge.merge.build.models.LevelBuild;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LevelBuildRepository extends MongoRepository<LevelBuild, UUID> {
    Optional<LevelBuild> findByIdempotencyKey(String idempotencyKey);
    List<LevelBuild> findByStudentIdAndStageId(UUID studentId, UUID stageId);
}
