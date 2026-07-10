package com.merge.merge.identity.models;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

/**
 * The single source of truth for a student's identity, progression, and
 * authentication credentials.
 *
 * <p>email carries a real, database-level unique index enforced by MongoDB.
 * The Redis {@code registered_emails} set checked in AuthService is a
 * fast-path optimisation only — it rejects obvious duplicates before paying
 * for a transaction, but two near-simultaneous requests for the same email
 * can both pass the Redis check before either has written. The unique index
 * here is the actual correctness guarantee; a DuplicateKeyException on save
 * is the signal a genuine race produced a collision.</p>
 *
 * <p>passwordHash is stored but never exposed in any response DTO. Every
 * Student-derived response is built by explicit field-by-field mapping in
 * StudentResponse.from(), which lists every included field individually and
 * omits passwordHash by construction — there is no mechanism by which it
 * can appear in a response unless someone deliberately adds it.</p>
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Document(collection = "students")
public class Student {

    @Id
    private UUID id;

    /** Unique index enforced at the database level — see class Javadoc. */
    @Indexed(unique = true)
    private String email;

    /**
     * BCrypt hash with {bcrypt} algorithm prefix, produced by
     * PasswordEncoderFactories.createDelegatingPasswordEncoder() at strength 12.
     * Never returned in any response DTO.
     */
    private String passwordHash;

    private String name;

    private String details;

    private int xp;

    private UUID stageId;

    private boolean internshipEligible;

    private UUID lastCompletedConceptId;

    public Student(UUID id, String email, String passwordHash, String name, String details, UUID stageId) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.details = details;
        this.stageId = stageId;
    }

    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
    }

    public void addXp(int amount) {
        if (amount < 0) {
            throw new IllegalArgumentException("xp amount must not be negative");
        }
        this.xp += amount;
    }

    public void advanceToStage(UUID stageId) {
        this.stageId = stageId;
    }

    public void grantInternshipEligibility() {
        this.internshipEligible = true;
    }

    public void markConceptCompleted(UUID conceptId) {
        this.lastCompletedConceptId = conceptId;
    }
}
