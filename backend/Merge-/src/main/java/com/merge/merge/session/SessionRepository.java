package com.merge.merge.session;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends MongoRepository<Session, UUID> {
    Optional<Session> findByStudentIdAndEndedAtIsNull(UUID studentId);
}
