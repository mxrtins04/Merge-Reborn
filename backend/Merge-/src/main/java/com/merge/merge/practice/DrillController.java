package com.merge.merge.practice;

import com.merge.merge.practice.dto.CreateDrillRequest;
import com.merge.merge.practice.dto.DrillResponse;
import com.merge.merge.practice.dto.SubmitDrillRequest;
import com.merge.merge.practice.service.DrillService;
import com.merge.merge.practice.service.impl.DrillServiceImpl.IdempotentResultException;
import com.merge.merge.shared.SessionGuard;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for managing Drill practice lifecycles.
 * Handles the creation and submission of student practice drills.
 */
@RestController
@RequestMapping("/api/v1/drills")
@RequiredArgsConstructor
public class DrillController {

    private final DrillService drillService;

    /**
     * Creates a new Drill for the authenticated student.
     *
     * <pre>POST /api/v1/drills</pre>
     */
    @PostMapping
    public ResponseEntity<DrillResponse> createDrill(
            @Valid @RequestBody CreateDrillRequest request,
            Authentication authentication
    ) {
        UUID studentId = (UUID) authentication.getPrincipal();
        SessionGuard.assertAllowed(SessionGuard.DRILL_SUBMIT);
        DrillResponse response = drillService.createDrill(studentId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Submits an answer for a Drill.
     * Short-circuits with HTTP 200 and the already resolved Drill if a duplicate
     * submission is detected via the idempotency key.
     *
     * <pre>POST /api/v1/drills/{id}/submit</pre>
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<DrillResponse> submitDrill(
            @PathVariable("id") UUID id,
            @Valid @RequestBody SubmitDrillRequest request,
            Authentication authentication
    ) {
        UUID studentId = (UUID) authentication.getPrincipal();
        try {
            DrillResponse response = drillService.submitDrill(id, studentId, request);
            return ResponseEntity.ok(response);
        } catch (IdempotentResultException e) {
            return ResponseEntity.ok(e.getResult());
        }
    }
}
