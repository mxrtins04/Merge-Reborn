package com.merge.merge.remediation.service;

import com.merge.merge.build.event.BuildCompletedEvent;
import com.merge.merge.practice.event.DrillPassedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class RemediationEventListener {

    private final RemediationService remediationService;

    @EventListener
    public void onDrillPassed(DrillPassedEvent event) {
        log.info("RemediationEventListener received DrillPassedEvent for student: {}, concept: {}", event.getStudentId(), event.getConceptId());
        remediationService.handlePass(
                event.getStudentId(),
                event.getConceptId(),
                "DRILL",
                Map.of("drillId", event.getDrillId().toString())
        );
    }

    @EventListener
    public void onBuildCompleted(BuildCompletedEvent event) {
        log.info("RemediationEventListener received BuildCompletedEvent for student: {}, concept: {}, passed: {}", event.getStudentId(), event.getConceptId(), event.isPassed());
        if (!event.isPassed()) {
            remediationService.handleFailure(
                    event.getStudentId(),
                    event.getConceptId(),
                    "BUILD",
                    Map.of("idempotencyKey", event.getIdempotencyKey() != null ? event.getIdempotencyKey() : "")
            );
        }
    }
}
