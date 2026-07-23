package com.merge.merge.build.repository;

import com.merge.merge.build.models.ComprehensionCheck;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.UUID;

public interface ComprehensionCheckRepository extends MongoRepository<ComprehensionCheck, UUID> {
    Optional<ComprehensionCheck> findByBuildId(UUID buildId);
}
