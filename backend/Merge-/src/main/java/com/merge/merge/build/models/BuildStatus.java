package com.merge.merge.build.models;

/**
 * Lifecycle states for ConceptBuild and LevelBuild documents.
 */
public enum BuildStatus {
    QUEUED,
    RUNNING,
    PASSED,
    FAILED,
    MISSION_GENERATING,
    MISSION_READY,
    FAILED_NEEDS_REVIEW
}
