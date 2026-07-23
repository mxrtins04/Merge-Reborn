package com.merge.merge.scout.repository;

import com.merge.merge.scout.models.PersonalisationProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.UUID;

public interface PersonalisationProfileRepository extends MongoRepository<PersonalisationProfile, UUID> {
    Optional<PersonalisationProfile> findByStudentId(UUID studentId);
}
