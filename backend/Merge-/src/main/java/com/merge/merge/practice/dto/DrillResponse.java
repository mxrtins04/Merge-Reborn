package com.merge.merge.practice.dto;

import com.merge.merge.practice.model.Drill;
import com.merge.merge.practice.model.SubmissionStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * API response shape for a Drill.
 *
 * <p><strong>The {@code answer} field from the Drill document is intentionally omitted.</strong>
 * This record lists every included field explicitly; there is no mechanism by which the
 * expected answer can appear in a response unless someone deliberately adds it here.</p>
 *
 * <p>On creation: status=PENDING, passed=false, xpAwarded=0, feedback=null, answeredAt=null.
 * After submission: all fields reflect the resolved state.</p>
 */
public record DrillResponse(
        UUID id,
        UUID conceptId,
        UUID studentId,
        String question,
        boolean passed,
        int xpAwarded,
        String feedback,
        SubmissionStatus status,
        Instant serverDeadline,
        Instant answeredAt,
        boolean pasteAttempted,
        int tabFocusLost,
        Instant createdAt
) {
    /**
     * Factory method. Never use object mapping frameworks for this — every field
     * must be explicitly named so the omission of {@code answer} is enforced
     * at the type level.
     */
    public static DrillResponse from(Drill drill) {
        return new DrillResponse(
                drill.getId(),
                drill.getConceptId(),
                drill.getStudentId(),
                drill.getQuestion(),
                drill.isPassed(),
                drill.getXpAwarded(),
                drill.getFeedback(),
                drill.getStatus(),
                drill.getServerDeadline(),
                drill.getAnsweredAt(),
                drill.isPasteAttempted(),
                drill.getTabFocusLost(),
                drill.getCreatedAt()
        );
    }
}
