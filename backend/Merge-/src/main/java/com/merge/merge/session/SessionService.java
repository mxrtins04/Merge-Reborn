package com.merge.merge.session;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;

    // -------------------------------------------------------------------------
    // Session creation
    // -------------------------------------------------------------------------

    public Session getOrCreateOpenSession(UUID studentId, Mood initialMood) {
        Optional<Session> openSession = sessionRepository.findByStudentIdAndEndedAtIsNull(studentId);
        if (openSession.isPresent()) {
            return openSession.get();
        }

        Session newSession = Session.builder()
                .id(UUID.randomUUID())
                .studentId(studentId)
                .mood(initialMood)
                .type(deriveType(initialMood))
                .path(new ArrayList<>())
                .lastActivityAt(Instant.now())
                .build();

        try {
            return sessionRepository.save(newSession);
        } catch (DuplicateKeyException e) {
            log.info("Concurrent session creation detected for studentId: {}. Returning existing session.", studentId);
            return sessionRepository.findByStudentIdAndEndedAtIsNull(studentId)
                    .orElseThrow(() -> new IllegalStateException(
                            "Duplicate session creation detected, but could not find the existing open session.", e));
        }
    }

    // -------------------------------------------------------------------------
    // Session end
    // -------------------------------------------------------------------------

    /**
     * Ends an open session with the given reason. Used by internal callers
     * (idle sweep, Build-passed event listener) that do not have an
     * authenticated principal. No ownership check is performed.
     *
     * @throws SessionNotFoundException     if no session with the given id exists
     * @throws SessionAlreadyEndedException if the session is already closed
     */
    Session endSession(UUID sessionId, EndReason reason) {
        return doEndSession(sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId)), reason);
    }

    /**
     * Ends a session on behalf of an authenticated student. Verifies that the
     * session belongs to {@code requestingStudentId} before closing it — a student
     * cannot end another student's session. Returns 404 (not 403) on ownership
     * mismatch to avoid leaking session existence.
     *
     * @throws SessionNotFoundException     if no session exists OR it belongs to a different student
     * @throws SessionAlreadyEndedException if the session is already closed
     */
    Session endSessionForStudent(UUID sessionId, EndReason reason, UUID requestingStudentId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));
        if (!session.getStudentId().equals(requestingStudentId)) {
            throw new SessionNotFoundException(sessionId);
        }
        return doEndSession(session, reason);
    }

    private Session doEndSession(Session session, EndReason reason) {
        if (session.getEndedAt() != null) {
            throw new SessionAlreadyEndedException(session.getId());
        }
        session.setEndedAt(Instant.now());
        session.setEndReason(reason);
        return sessionRepository.save(session);
    }

    // -------------------------------------------------------------------------
    // Mood → type derivation (PRD Section 6)
    // -------------------------------------------------------------------------

    /**
     * Derives the session type from the student-reported mood.
     * FRESH or OKAY → FULL_FORCE.  EXHAUSTED → EXHAUSTED.
     * The client sets mood; the server derives type; the client never sets type directly.
     */
    static SessionType deriveType(Mood mood) {
        return switch (mood) {
            case FRESH, OKAY -> SessionType.FULL_FORCE;
            case EXHAUSTED -> SessionType.EXHAUSTED;
        };
    }
}
