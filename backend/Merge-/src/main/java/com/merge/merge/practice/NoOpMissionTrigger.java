package com.merge.merge.practice;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Stopgap implementation of {@link MissionTrigger}.
 *
 * <p><strong>Ticket 5 (Remediation / Mission) has not yet been built by either engineer.</strong>
 * This class exists so that {@code DrillService} compiles and the fail path is wired end-to-end
 * without silently dropping the trigger. When Ticket 5 ships, a real
 * {@code RemediationMissionTrigger} in {@code com.merge.merge.remediation} will replace
 * this bean as the primary {@link MissionTrigger} implementation, and this class can be
 * removed or kept as a test double.</p>
 *
 * <p>Every invocation logs at INFO level so that integration tests can assert the log
 * line directly, confirming the trigger was called without needing a real Remediation
 * module to be present.</p>
 */
@Component
@Slf4j
public class NoOpMissionTrigger implements MissionTrigger {

    @Override
    public void trigger(UUID studentId, UUID conceptId) {
        // STOPGAP — Ticket 5 not yet built by either engineer.
        // A real Mission would be generated here via InstructorService.missionGenerate(studentId, conceptId, context).
        log.info(
                "[NoOpMissionTrigger] Mission would fire: studentId={} conceptId={} — " +
                "Ticket 5 (Remediation) not yet implemented. This log line is the only side-effect.",
                studentId, conceptId
        );
    }
}
