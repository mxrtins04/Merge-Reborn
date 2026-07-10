package com.merge.merge.remediation.service;

import com.merge.merge.practice.MissionTrigger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@Primary
@RequiredArgsConstructor
@Slf4j
public class RemediationMissionTrigger implements MissionTrigger {

    private final RemediationService remediationService;

    @Override
    public void trigger(UUID studentId, UUID conceptId) {
        log.info("RemediationMissionTrigger triggering failure flow for student: {}, concept: {}", studentId, conceptId);
        remediationService.handleFailure(
                studentId,
                conceptId,
                "DRILL",
                Map.of("triggeredAt", java.time.Instant.now().toString())
        );
    }
}
