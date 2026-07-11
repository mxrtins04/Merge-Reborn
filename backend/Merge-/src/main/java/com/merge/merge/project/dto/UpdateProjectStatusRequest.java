package com.merge.merge.project.dto;

import com.merge.merge.project.model.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateProjectStatusRequest(
    @NotNull(message = "status must not be null") ProjectStatus status,
    String review
) {}
