package com.merge.merge.project.dto;

import com.merge.merge.project.model.Project;
import com.merge.merge.project.model.ProjectStatus;
import java.time.Instant;
import java.util.UUID;

public record ProjectResponse(
    UUID id,
    UUID studentId,
    String given,
    String link,
    String prd,
    String review,
    ProjectStatus status,
    Instant createdAt,
    Instant updatedAt
) {
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
            project.getId(),
            project.getStudentId(),
            project.getGiven(),
            project.getLink(),
            project.getPrd(),
            project.getReview(),
            project.getStatus(),
            project.getCreatedAt(),
            project.getUpdatedAt()
        );
    }
}
