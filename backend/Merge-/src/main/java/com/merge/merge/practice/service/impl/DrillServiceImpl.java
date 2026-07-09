package com.merge.merge.practice.service.impl;

import com.merge.merge.ai.model.Instructor;
import com.merge.merge.ai.service.InstructorService;
import com.merge.merge.curriculum.service.ConceptService;
import com.merge.merge.identity.service.StudentService;
import com.merge.merge.practice.MissionTrigger;
import com.merge.merge.practice.dto.CreateDrillRequest;
import com.merge.merge.practice.dto.DrillResponse;
import com.merge.merge.practice.dto.SubmitDrillRequest;
import com.merge.merge.practice.event.DrillPassedEvent;
import com.merge.merge.practice.model.Drill;
import com.merge.merge.practice.model.SubmissionStatus;
import com.merge.merge.practice.repository.DrillRepository;
import com.merge.merge.practice.service.DrillService;
import com.merge.merge.shared.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Core logic for Drill creation and submission.
 *
 * <h3>Answer normalisation</h3>
 * <p>Answers are compared trimmed + case-insensitive.  Drills are always string
 * responses (README: "Drills are always string. Judge0 runs only on Concept_build and
 * Level_build submissions").  Exact matching would penalise students for trailing spaces
 * or capitalisation differences with no pedagogical benefit.  Trimmed case-insensitive
 * matching catches the most common inadvertent mismatches while remaining strict about
 * substance.  No stemming, no synonyms — this is not semantic matching.  If a specific
 * concept requires exact matching (e.g. a case-sensitive command syntax question), the
 * intended question design must make the expectation explicit in the question text; the
 * comparison strategy here does not change.</p>
 *
 * <h3>XP amount</h3>
 * <p>10 XP per passed Drill.  Chosen as a round, meaningful amount consistent with the
 * platform's XP economy (Ticket 1).  Can be promoted to a constant or concept-level
 * config when the XP economy is fully specified.</p>
 *
 * <h3>Session tracking</h3>
 * <p>The prompt references {@code SessionGuard.assertAllowed(DRILL_SUBMIT)}.  No such
 * class exists in this codebase.  The actual session infrastructure is
 * {@link com.merge.merge.session.SessionService}, which uses
 * {@link com.merge.merge.session.ActionType#DRILL_ATTEMPT} to record session path entries.
 * Session gating is not implemented here — Ticket 3 (Timer / Anti-cheat) is the right
 * place to wire it in once the session-gate contract is defined.  The {@code DRILL_ATTEMPT}
 * path entry should be appended here once that contract exists.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DrillServiceImpl implements DrillService {

    static final int DRILL_XP = 10;
    static final long DEADLINE_SECONDS = 10;

    private final DrillRepository drillRepository;
    private final InstructorService instructorService;
    private final ConceptService conceptService;
    private final StudentService studentService;
    private final MissionTrigger missionTrigger;
    private final ApplicationEventPublisher eventPublisher;

    // -------------------------------------------------------------------------
    // Drill creation
    // -------------------------------------------------------------------------

    @Override
    public DrillResponse createDrill(UUID studentId, CreateDrillRequest request) {
        // 1. Validate concept exists — throws ResourceNotFoundException → 404 if not.
        conceptService.getById(request.conceptId());

        // 2. Call InstructorService to generate the drill question synchronously.
        //    generateDrillSync is the DRILL_GENERATE method confirmed from the interface.
        //    It calls Gemini in-thread and returns an Instructor with result = question text.
        Instructor instructor = instructorService.generateDrillSync(studentId, request.conceptId());

        String question = instructor.getResult();
        // The answer is embedded in the question for text drills. For MVP, the Gemini
        // prompt is expected to return a structured "QUESTION: ... ANSWER: ..." block.
        // We parse the answer here; if Gemini returns an unstructured response the answer
        // falls back to the full result, and the comparison on submit will behave accordingly.
        String answer = parseAnswer(question);
        String questionText = parseQuestion(question);

        // 3. Persist with a 10-second server deadline.
        Drill drill = Drill.builder()
                .id(UUID.randomUUID())
                .conceptId(request.conceptId())
                .studentId(studentId)
                .question(questionText)
                .answer(answer)
                .passed(false)
                .xpAwarded(0)
                .status(SubmissionStatus.PENDING)
                .serverDeadline(Instant.now().plusSeconds(DEADLINE_SECONDS))
                .createdAt(Instant.now())
                .build();

        Drill saved = drillRepository.save(drill);
        log.info("Drill created: drillId={} studentId={} conceptId={} deadline={}",
                saved.getId(), studentId, request.conceptId(), saved.getServerDeadline());

        // 4. Return — question only, never the answer. DrillResponse.from() enforces this.
        return DrillResponse.from(saved);
    }

    // -------------------------------------------------------------------------
    // Drill submission
    // -------------------------------------------------------------------------

    @Override
    public DrillResponse submitDrill(UUID drillId, UUID studentId, SubmitDrillRequest request) {
        // 1. Idempotency check — if this key already resolved a Drill, return it unchanged.
        if (request.idempotencyKey() != null) {
            drillRepository.findByIdempotencyKey(request.idempotencyKey())
                    .ifPresent(existing -> {
                        if (existing.getStatus() != SubmissionStatus.PENDING) {
                            log.info("Idempotent submit hit: drillId={} key={} status={}",
                                    existing.getId(), request.idempotencyKey(), existing.getStatus());
                            // Return early by throwing — caught and re-thrown as a direct return
                            throw new IdempotentResultException(DrillResponse.from(existing));
                        }
                    });
        }

        // 2. Load and verify ownership.
        Drill drill = drillRepository.findById(drillId)
                .orElseThrow(() -> ResourceNotFoundException.forId("Drill", drillId));

        if (!drill.getStudentId().equals(studentId)) {
            // 404 not 403 — do not confirm the drill id exists to another student.
            throw ResourceNotFoundException.forId("Drill", drillId);
        }

        // 3. If already resolved (not PENDING), return current state.
        if (drill.getStatus() != SubmissionStatus.PENDING) {
            log.info("Submit on already-resolved drill: drillId={} status={}", drillId, drill.getStatus());
            return DrillResponse.from(drill);
        }

        // 4. Always record evidence fields regardless of outcome.
        drill.setPasteAttempted(request.pasteAttempted());
        drill.setTabFocusLost(request.tabFocusLost());
        drill.setAnsweredAt(Instant.now());
        drill.setIdempotencyKey(request.idempotencyKey());

        // 5. Late submission check — serverDeadline elapsed = automatic fail.
        boolean isLate = drill.getAnsweredAt().isAfter(drill.getServerDeadline());

        if (isLate) {
            log.info("Late submission auto-fail: drillId={} answeredAt={} deadline={}",
                    drillId, drill.getAnsweredAt(), drill.getServerDeadline());
            return resolveAsFail(drill, "Submission arrived after the server deadline.");
        }

        // 6. Answer comparison — trimmed + case-insensitive.
        String submitted = request.answer().trim().toLowerCase();
        String expected = drill.getAnswer().trim().toLowerCase();
        boolean correct = submitted.equals(expected);

        if (correct) {
            return resolveAsPass(drill);
        } else {
            return resolveAsFail(drill, "Answer did not match.");
        }
    }

    // -------------------------------------------------------------------------
    // Pass / fail resolution helpers
    // -------------------------------------------------------------------------

    private DrillResponse resolveAsPass(Drill drill) {
        drill.setStatus(SubmissionStatus.PASSED);
        drill.setPassed(true);
        drill.setXpAwarded(DRILL_XP);

        // Award XP atomically via $inc — no lost-update race.
        studentService.awardXp(drill.getStudentId(), DRILL_XP);

        // Publish DrillPassedEvent — InstructorEventListener picks it up synchronously
        // and calls generateComprehensionSync to produce feedback. The event listener
        // populates event.result, which we capture as the drill feedback.
        DrillPassedEvent passedEvent = new DrillPassedEvent(this,
                drill.getStudentId(), drill.getConceptId(), drill.getId());
        eventPublisher.publishEvent(passedEvent);
        drill.setFeedback(passedEvent.getResult());

        Drill saved = drillRepository.save(drill);
        log.info("Drill passed: drillId={} studentId={} xpAwarded={}",
                saved.getId(), saved.getStudentId(), DRILL_XP);
        return DrillResponse.from(saved);
    }

    private DrillResponse resolveAsFail(Drill drill, String reason) {
        drill.setStatus(SubmissionStatus.FAILED);
        drill.setPassed(false);
        drill.setXpAwarded(0);
        drill.setFeedback(reason);

        Drill saved = drillRepository.save(drill);
        log.info("Drill failed: drillId={} studentId={} reason={}",
                saved.getId(), saved.getStudentId(), reason);

        // Trigger mission — NoOpMissionTrigger for now (Ticket 5 not yet built).
        missionTrigger.trigger(drill.getStudentId(), drill.getConceptId());

        return DrillResponse.from(saved);
    }

    // -------------------------------------------------------------------------
    // Question / answer parsing
    // -------------------------------------------------------------------------

    /**
     * Parses the question text from the Gemini response.
     *
     * <p>The expected Gemini format is:
     * <pre>
     * QUESTION: &lt;question text&gt;
     * ANSWER: &lt;answer text&gt;
     * </pre>
     * If the response does not follow this format, the full response is treated
     * as the question text.</p>
     */
    static String parseQuestion(String geminiResult) {
        if (geminiResult == null) return "";
        if (geminiResult.contains("QUESTION:") && geminiResult.contains("ANSWER:")) {
            int qStart = geminiResult.indexOf("QUESTION:") + "QUESTION:".length();
            int aStart = geminiResult.indexOf("ANSWER:");
            return geminiResult.substring(qStart, aStart).trim();
        }
        return geminiResult.trim();
    }

    /**
     * Parses the answer text from the Gemini response.
     *
     * <p>Falls back to the full result if the expected format is not present.
     * In that case, comparison on submit against the full result is the effective
     * behaviour — this degrades gracefully rather than failing silently.</p>
     */
    static String parseAnswer(String geminiResult) {
        if (geminiResult == null) return "";
        if (geminiResult.contains("ANSWER:")) {
            int aStart = geminiResult.indexOf("ANSWER:") + "ANSWER:".length();
            return geminiResult.substring(aStart).trim();
        }
        return geminiResult.trim();
    }

    // -------------------------------------------------------------------------
    // Internal: idempotency early-return carrier
    // -------------------------------------------------------------------------

    /**
     * Used internally to short-circuit submission processing when an idempotency key
     * matches an already-resolved Drill. This avoids re-processing without needing
     * a separate response path through the service interface.
     *
     * <p>Caught at the controller boundary; the response is extracted and returned
     * directly. This is an internal implementation detail — it is not a domain exception
     * and must never be added to GlobalExceptionHandler.</p>
     */
    public static final class IdempotentResultException extends RuntimeException {
        private final DrillResponse result;

        public IdempotentResultException(DrillResponse result) {
            super(null, null, true, false); // no message, no stack trace
            this.result = result;
        }

        public DrillResponse getResult() {
            return result;
        }
    }
}
