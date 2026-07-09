package com.merge.merge.practice.model;

/**
 * Lifecycle states for a Drill document.
 *
 * <p>PENDING   — Drill created, question served, student has not yet submitted.</p>
 * <p>PASSED    — Submitted answer matched the expected answer; XP awarded.</p>
 * <p>FAILED    — Submitted answer did not match, or submission arrived after
 *                serverDeadline (late is an automatic fail regardless of correctness).</p>
 * <p>EXPIRED   — serverDeadline elapsed without any submission. A student who never
 *                submits leaves the Drill in this terminal state after the deadline
 *                passes (set by the submit endpoint when it detects a late arrival;
 *                no scheduled sweep is needed at this scale).</p>
 */
public enum SubmissionStatus {
    PENDING,
    PASSED,
    FAILED,
    EXPIRED
}
