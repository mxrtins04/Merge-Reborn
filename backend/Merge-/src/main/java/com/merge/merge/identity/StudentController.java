package com.merge.merge.identity;

import com.merge.merge.identity.dto.EProfileResponse;
import com.merge.merge.identity.dto.StudentResponse;
import com.merge.merge.identity.service.EProfileService;
import com.merge.merge.identity.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Read endpoints for the authenticated student's own data. Identity is resolved
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
}
