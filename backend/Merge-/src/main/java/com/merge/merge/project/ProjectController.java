package com.merge.merge.project;

import com.merge.merge.project.dto.CreateProjectRequest;
import com.merge.merge.project.dto.ProjectResponse;
import com.merge.merge.project.dto.UpdateProjectStatusRequest;
import com.merge.merge.project.model.Project;
import com.merge.merge.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            Authentication authentication
    ) {
        UUID studentId = (UUID) authentication.getPrincipal();
        Project project = projectService.createProject(
                studentId,
                request.given(),
                request.link(),
                request.prd()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ProjectResponse.from(project));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable("id") UUID id) {
        Project project = projectService.getProject(id);
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getMyProjects(Authentication authentication) {
        UUID studentId = (UUID) authentication.getPrincipal();
        List<ProjectResponse> projects = projectService.getProjectsByStudentId(studentId).stream()
                .map(ProjectResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(projects);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ProjectResponse> updateProjectStatus(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateProjectStatusRequest request
    ) {
        Project project = projectService.updateProjectStatus(
                id,
                request.status(),
                request.review()
        );
        return ResponseEntity.ok(ProjectResponse.from(project));
    }
}
