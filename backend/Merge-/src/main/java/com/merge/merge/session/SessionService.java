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

    public Session getOrCreateOpenSession(UUID studentId, Mood initialMood) {
        // First, check if there's already an open session
        Optional<Session> openSession = sessionRepository.findByStudentIdAndEndedAtIsNull(studentId);
        if (openSession.isPresent()) {
            return openSession.get();
        }

        // If not, build and try to save a new one
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
            // In case of a duplicate key race condition, retrieve the open session that was successfully inserted
            return sessionRepository.findByStudentIdAndEndedAtIsNull(studentId)
                    .orElseThrow(() -> new IllegalStateException("Duplicate session creation detected, but could not find the existing open session.", e));
        }
    }

    private SessionType deriveType(Mood mood) {
        if (mood == Mood.FRESH || mood == Mood.OKAY) {
            return SessionType.FULL_FORCE;
        } else if (mood == Mood.EXHAUSTED) {
            return SessionType.EXHAUSTED;
        }
        throw new IllegalArgumentException("Unsupported mood: " + mood);
    }
}
