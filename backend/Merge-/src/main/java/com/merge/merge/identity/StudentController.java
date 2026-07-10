package com.merge.merge.identity;

import com.merge.merge.identity.dto.CredentialRequest;
import com.merge.merge.identity.dto.EProfileResponse;
import com.merge.merge.identity.dto.OnboardingRequest;
import com.merge.merge.identity.dto.StudentResponse;
import com.merge.merge.identity.models.StaticData;
import com.merge.merge.identity.service.ContextService;
import com.merge.merge.identity.service.CredentialService;
import com.merge.merge.identity.service.EProfileService;
import com.merge.merge.identity.service.StudentService;
import com.merge.merge.shared.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.merge.merge.curriculum.service.StageService;
import com.merge.merge.curriculum.models.Stage;
import com.merge.merge.identity.models.Student;
import java.util.Comparator;
import java.util.UUID;

/**
 * Read and write endpoints for the authenticated student's own data. Identity is resolved
 * from the JWT via SecurityContextHolder — the principal is the raw studentId
 * UUID set by JwtAuthenticationFilter. No student can read another student's
 * data through these endpoints.
 *
 * <p>Controllers are thin: validate, extract principal, delegate to service,
 * map to DTO, return. No business logic here.</p>
 *
 * <p>All exceptions (ResourceNotFoundException → 404, etc.) are handled by
 * GlobalExceptionHandler. No @ExceptionHandler in this class.</p>
 */
@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
class StudentController {

    private final StudentService studentService;
    private final EProfileService eProfileService;
    private final ContextService contextService;
    private final CredentialService credentialService;
    private final StageService stageService;

    /**
     * Returns the authenticated student's own profile.
     *
     * <p>Response is a StudentResponse DTO built by explicit field mapping.
     * The entity is never returned directly. This is the structural guarantee
     * that no sensitive field (passwordHash or any future addition to Student)
     * can leak by accident.</p>
     */
    @GetMapping("/me")
    ResponseEntity<StudentResponse> me(Authentication authentication) {
        UUID studentId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(StudentResponse.from(studentService.getById(studentId)));
    }

    /**
     * Returns the authenticated student's engineering profile (EProfile).
     *
     * <p>EProfile is a separate document from Student; this endpoint calls
     * EProfileService.getByStudentId which throws ResourceNotFoundException
     * (→ 404 via GlobalExceptionHandler) if no profile has been created yet
     * for this student.</p>
     */
    @GetMapping("/me/profile")
    ResponseEntity<EProfileResponse> meProfile(Authentication authentication) {
        UUID studentId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(EProfileResponse.from(eProfileService.getByStudentId(studentId)));
    }

    /**
     * Submits the student's onboarding context details.
     * This is a one-time write; second submission will be rejected by ContextService.
     */
    @PostMapping("/me/onboarding")
    ResponseEntity<Void> onboard(Authentication authentication, @Valid @RequestBody OnboardingRequest request) {
        UUID studentId = (UUID) authentication.getPrincipal();

        try {
            contextService.getByStudentId(studentId);
        } catch (ResourceNotFoundException e) {
            contextService.createForStudent(studentId);
        }

        StaticData staticData = new StaticData(
                request.yearsOfExperience(),
                request.preferredLanguage(),
                request.motivation()
        );

        contextService.recordScoutIngestion(studentId, staticData);

        // Auto-assign the student to the initial stage (stage with lowest XP threshold)
        Student student = studentService.getById(studentId);
        if (student.getStageId() == null) {
            stageService.listAll().stream()
                    .min(Comparator.comparingInt(Stage::getXpThreshold))
                    .ifPresent(firstStage -> studentService.advanceToStage(studentId, firstStage.getId()));
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Submits the student's Gemini API key.
     * This is encrypted before saving and never returned in any response.
     */
    @PostMapping("/me/credentials")
    ResponseEntity<Void> submitCredentials(Authentication authentication, @Valid @RequestBody CredentialRequest request) {
        UUID studentId = (UUID) authentication.getPrincipal();
        credentialService.storeToken(studentId, CredentialService.TokenType.GEMINI, request.token());
        return ResponseEntity.ok().build();
    }
}
