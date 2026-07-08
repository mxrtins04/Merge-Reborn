package com.merge.merge.curriculum.repository;

import com.merge.merge.curriculum.models.Stage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.UUID;

public interface StageRepository extends MongoRepository<Stage, UUID> {
}
