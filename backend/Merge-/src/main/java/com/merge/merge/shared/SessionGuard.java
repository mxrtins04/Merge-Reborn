package com.merge.merge.shared;

import lombok.extern.slf4j.Slf4j;

/**
 * Guard class used to assert whether specific actions are allowed in the student's current session.
 * For now, this is a placeholder/log-only guard to satisfy the requirement for DRILL_SUBMIT validation.
 */
@Slf4j
public class SessionGuard {

    public static final String DRILL_SUBMIT = "DRILL_SUBMIT";

    /**
     * Asserts that the action is allowed in the current session.
     * Logs the assertion.
     *
     * @param action the action to check
     */
    public static void assertAllowed(String action) {
        log.info("[SessionGuard] assertAllowed: action={} is allowed", action);
    }
}
