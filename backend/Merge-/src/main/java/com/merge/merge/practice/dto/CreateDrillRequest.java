package com.merge.merge.practice.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request body for {@code POST /api/v1/drills}.
 * studentId is resolved server-side from the JWT — clients do not supply it.
 */
public record CreateDrillRequest(
        @NotNull(message = "conceptId is required")
        UUID conceptId
) {}
