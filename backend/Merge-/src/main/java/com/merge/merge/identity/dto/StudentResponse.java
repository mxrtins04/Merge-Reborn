package com.merge.merge.identity.dto;

import com.merge.merge.identity.models.Student;

import java.util.UUID;

/**
 * Response DTO for Student data. Built by explicit field-by-field mapping from
 * the Student entity — never by generic serialization, never by returning the
 * entity directly. This is the structural guarantee that auth-only fields
 * (email, passwordHash) stored on Student cannot leak into a response by
 * default: any future addition to Student is opt-in here, not opt-out.
 *
 * <p>Rule: if a field is not listed here, it is not in the response. Period.</p>
 */
public record StudentResponse(
        UUID id,
        String name,
        String details,
        int xp,
        UUID stageId,
        boolean internshipEligible
) {
    /**
     * The only way to produce a StudentResponse. Callers cannot accidentally
     * return a raw Student or use a mapper that copies all fields.
     */
    public static StudentResponse from(Student student) {
        return new StudentResponse(
                student.getId(),
                student.getName(),
                student.getDetails(),
                student.getXp(),
                student.getStageId(),
                student.isInternshipEligible()
        );
    }
}
