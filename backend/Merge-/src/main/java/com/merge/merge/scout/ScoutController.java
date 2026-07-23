package com.merge.merge.scout;

import com.merge.merge.scout.models.ScoutAssessment;
import com.merge.merge.scout.models.PersonalisationProfile;
import com.merge.merge.scout.service.ScoutService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/scout")
@RequiredArgsConstructor
@Slf4j
public class ScoutController {

    private final ScoutService scoutService;

    @GetMapping("/assessment")
    public ResponseEntity<ScoutAssessment> getAssessment(Authentication authentication) {
        UUID studentId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(scoutService.startOrGetAssessment(studentId));
    }

    @PostMapping("/background")
    public ResponseEntity<ScoutAssessment> submitBackground(
            @RequestBody Map<String, String> answers,
            Authentication authentication
    ) {
        UUID studentId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(scoutService.submitBackgroundAnswers(studentId, answers));
    }

    @PostMapping("/conceptual")
    public ResponseEntity<ScoutAssessment> submitConceptual(
            @RequestBody Map<String, String> answers,
            Authentication authentication
    ) {
        UUID studentId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(scoutService.submitConceptualAnswers(studentId, answers));
    }

    @PostMapping("/baseline")
    public ResponseEntity<ScoutAssessment> submitBaseline(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        UUID studentId = (UUID) authentication.getPrincipal();
        String code = body.getOrDefault("code", "");
        return ResponseEntity.ok(scoutService.submitBaselineCode(studentId, code));
    }

    @PostMapping("/complete")
    public ResponseEntity<PersonalisationProfile> completeScout(Authentication authentication) {
        UUID studentId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(scoutService.completeScoutAssessment(studentId));
    }
}
