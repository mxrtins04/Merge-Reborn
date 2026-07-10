package com.merge.merge.remediation.web;

import com.merge.merge.remediation.models.Mission;
import com.merge.merge.remediation.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/missions")
@RequiredArgsConstructor
public class RemediationController {

    private final MissionRepository missionRepository;

    @GetMapping("/active")
    public ResponseEntity<List<Mission>> getActiveMissions(Authentication authentication) {
        UUID studentId = (UUID) authentication.getPrincipal();
        List<Mission> activeMissions = missionRepository.findByStudentIdAndPassed(studentId, false);
        return ResponseEntity.ok(activeMissions);
    }
}
