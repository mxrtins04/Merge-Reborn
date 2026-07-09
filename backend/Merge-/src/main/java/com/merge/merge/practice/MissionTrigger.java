package com.merge.merge.practice;

import java.util.UUID;

/**
 * Port for triggering a Mission when a student fails a Drill.
 *
 * <p>The single implementation today is {@link NoOpMissionTrigger}, which logs
 * that a Mission would have fired. The real implementation belongs to the
 * Remediation module (Ticket 5) and has not yet been built by either engineer.
 * When Ticket 5 ships, it replaces this interface's implementation without
 * touching the Practice module.</p>
 *
 * <p>This interface lives in {@code com.merge.merge.practice} rather than
 * {@code com.merge.merge.remediation} because the caller (DrillService) is in
 * Practice, and Practice must not import from Remediation directly — that would
 * create a downward dependency on an unbuilt module. The trigger is Practice's
 * outbound port; Remediation will plug into it.</p>
 */
public interface MissionTrigger {

    /**
     * Triggers a personalised Mission for the given student on the given concept.
     *
     * @param studentId the student who failed the Drill
     * @param conceptId the concept the failed Drill belongs to
     */
    void trigger(UUID studentId, UUID conceptId);
}
