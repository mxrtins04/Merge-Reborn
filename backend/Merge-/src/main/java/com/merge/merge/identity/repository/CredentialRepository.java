package com.merge.merge.identity.repository;

import com.merge.merge.identity.models.Credential;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

public interface CredentialRepository extends MongoRepository<Credential, UUID> {
    Optional<Credential> findByStudentId(UUID studentId);
}
