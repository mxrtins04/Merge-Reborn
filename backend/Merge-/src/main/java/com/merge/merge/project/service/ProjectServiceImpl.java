package com.merge.merge.project.service;

import com.merge.merge.identity.models.Student;
import com.merge.merge.identity.service.StudentService;
import com.merge.merge.project.model.Project;
import com.merge.merge.project.model.ProjectStatus;
import com.merge.merge.project.repository.ProjectRepository;
import com.merge.merge.shared.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final StudentService studentService;

    @Override
    public Project createProject(UUID studentId, String given, String link, String prd) {
        // Ensure student exists (will throw ResourceNotFoundException if missing)
        
        studentService.getById(studentId);

        Instant now = Instant.now();
        Project project = Project.builder()
                .id(UUID.randomUUID())
                .studentId(studentId)
                .given(given)
                .link(link)
                .prd(prd)
                .status(ProjectStatus.PENDING)
                .createdAt(now)
                .updatedAt(now)
                .build();

        log.info("Creating project submission for student: {}", studentId);
        return projectRepository.save(project);
    }

    @Override
    public Project getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.forId("Project", id));
    }

    @Override
    public List<Project> getProjectsByStudentId(UUID studentId) {
        return projectRepository.findByStudentId(studentId);
    }

    @Override
    public Project updateProjectStatus(UUID id, ProjectStatus status, String review) {
        Project project = getProject(id);
        ProjectStatus oldStatus = project.getStatus();

        project.setStatus(status);
        project.setReview(review);
        project.setUpdatedAt(Instant.now());

        Project savedProject = projectRepository.save(project);
        log.info("Project {} status updated from {} to {}", id, oldStatus, status);

        // Trigger: Project's status transitions to APPROVED.
        if (status == ProjectStatus.APPROVED && oldStatus != ProjectStatus.APPROVED) {
            UUID studentId = savedProject.getStudentId();
            Student student = studentService.getById(studentId);

            // On transition to APPROVED, load the associated Student.
            // If Student.internshipEligible is already true, do nothing further (idempotent).
            if (!student.isInternshipEligible()) {
                log.info("Project approval triggering internship eligibility for student {}", studentId);
                studentService.grantInternshipEligibility(studentId);
            } else {
                log.info("Student {} is already eligible, eligibility grant is a no-op.", studentId);
            }
        }

        return savedProject;
    }
}
