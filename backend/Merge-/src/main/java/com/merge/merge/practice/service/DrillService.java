package com.merge.merge.practice.service;

import com.merge.merge.practice.dto.CreateDrillRequest;
import com.merge.merge.practice.dto.DrillResponse;
import com.merge.merge.practice.dto.SubmitDrillRequest;

import java.util.UUID;

public interface DrillService {

    /**
     * Creates a new Drill for the given student on the given concept.
     * Validates the concept exists, calls InstructorService to generate the question,
     * sets a 10-second server deadline, and persists the Drill.
     *
     * @param studentId resolved from the JWT; not supplied by the client
     * @param request   contains conceptId
     * @return DrillResponse with the question — answer is never included
     */
    DrillResponse createDrill(UUID studentId, CreateDrillRequest request);

    /**
     * Submits an answer for an existing Drill.
     * Idempotent on idempotencyKey. Late submissions (after serverDeadline) are an
     * automatic fail regardless of answer correctness. On pass: awards XP atomically.
     * On fail: triggers MissionTrigger. Records paste and focus evidence on all outcomes.
     *
     * @param drillId   the Drill to submit against
     * @param studentId resolved from JWT; used to verify ownership
     * @param request   contains answer, idempotencyKey, pasteAttempted, tabFocusLost
     * @return DrillResponse reflecting the resolved state
     */
    DrillResponse submitDrill(UUID drillId, UUID studentId, SubmitDrillRequest request);
}
