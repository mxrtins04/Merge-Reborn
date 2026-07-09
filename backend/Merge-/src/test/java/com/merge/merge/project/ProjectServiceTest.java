package com.merge.merge.project;

import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.identity.models.Student;
import com.merge.merge.identity.service.StudentService;
import com.merge.merge.project.model.Project;
import com.merge.merge.project.model.ProjectStatus;
import com.merge.merge.project.repository.ProjectRepository;
import com.merge.merge.project.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ProjectServiceTest {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private StudentService studentService;

    @Autowired
    private com.merge.merge.identity.repository.StudentRepository studentRepository;

    private Student student;

    @BeforeEach
    void setUp() {
        projectRepository.deleteAll();
        studentRepository.deleteAll();
        // Seed a student
        student = studentService.create("John Doe", "details", UUID.randomUUID());
    }

    @Test
    void testCreateProject_DefaultsToPending() {
        Project project = projectService.createProject(
                student.getId(),
                "Build a Modular Monolith",
                "https://github.com/john/merge",
                "PRD specification"
        );

        assertThat(project).isNotNull();
        assertThat(project.getStatus()).isEqualTo(ProjectStatus.PENDING);
        assertThat(project.getStudentId()).isEqualTo(student.getId());

        // Student is not eligible yet
        Student loadedStudent = studentService.getById(student.getId());
        assertThat(loadedStudent.isInternshipEligible()).isFalse();
    }

    @Test
    void testProjectApproval_GrantsEligibility() {
        Project project = projectService.createProject(
                student.getId(),
                "Build a Modular Monolith",
                "https://github.com/john/merge",
                "PRD specification"
        );

        Project approved = projectService.updateProjectStatus(
                project.getId(),
                ProjectStatus.APPROVED,
                "Looks excellent!"
        );

        assertThat(approved.getStatus()).isEqualTo(ProjectStatus.APPROVED);
        assertThat(approved.getReview()).isEqualTo("Looks excellent!");

        // Student must be granted eligibility
        Student loadedStudent = studentService.getById(student.getId());
        assertThat(loadedStudent.isInternshipEligible()).isTrue();
    }

    @Test
    void testProjectRejection_DoesNotGrantEligibility() {
        Project project = projectService.createProject(
                student.getId(),
                "Build a Modular Monolith",
                "https://github.com/john/merge",
                "PRD"
        );

        Project rejected = projectService.updateProjectStatus(
                project.getId(),
                ProjectStatus.REJECTED,
                "Missing requirements"
        );

        assertThat(rejected.getStatus()).isEqualTo(ProjectStatus.REJECTED);

        Student loadedStudent = studentService.getById(student.getId());
        assertThat(loadedStudent.isInternshipEligible()).isFalse();
    }

    @Test
    void testProjectApproval_Idempotency() {
        Project project1 = projectService.createProject(student.getId(), "Given 1", "Link 1", "PRD 1");
        Project project2 = projectService.createProject(student.getId(), "Given 2", "Link 2", "PRD 2");

        // Approve project1
        projectService.updateProjectStatus(project1.getId(), ProjectStatus.APPROVED, "Review 1");
        Student loadedStudent = studentService.getById(student.getId());
        assertThat(loadedStudent.isInternshipEligible()).isTrue();

        // Approve project2 (idempotent, no-op on the eligibility flag, should not error)
        projectService.updateProjectStatus(project2.getId(), ProjectStatus.APPROVED, "Review 2");
        loadedStudent = studentService.getById(student.getId());
        assertThat(loadedStudent.isInternshipEligible()).isTrue();
    }

    @Test
    void testInternshipEligibility_OneDirectionalOnly() {
        Project project = projectService.createProject(student.getId(), "Given", "Link", "PRD");

        // 1. Approve project -> true
        projectService.updateProjectStatus(project.getId(), ProjectStatus.APPROVED, "Approved");
        Student loadedStudent = studentService.getById(student.getId());
        assertThat(loadedStudent.isInternshipEligible()).isTrue();

        // 2. Reject the project later -> flag must stay true (one-directional)
        projectService.updateProjectStatus(project.getId(), ProjectStatus.REJECTED, "Rejected after all");
        loadedStudent = studentService.getById(student.getId());
        assertThat(loadedStudent.isInternshipEligible()).isTrue();

        // 3. Move back to PENDING -> flag must stay true
        projectService.updateProjectStatus(project.getId(), ProjectStatus.PENDING, "Pending re-review");
        loadedStudent = studentService.getById(student.getId());
        assertThat(loadedStudent.isInternshipEligible()).isTrue();
    }
}
