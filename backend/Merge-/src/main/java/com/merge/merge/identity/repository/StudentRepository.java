package com.merge.merge.identity.repository;

import com.merge.merge.identity.models.Student;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

public interface StudentRepository extends MongoRepository<Student, UUID> {

    /**
     * Used by AppUserDetailsService for authentication. The unique index on
     * Student.email (database-level) ensures this returns at most one result.
     */
    Optional<Student> findByEmail(String email);
}
