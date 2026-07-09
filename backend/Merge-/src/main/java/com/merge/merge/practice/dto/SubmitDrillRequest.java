package com.merge.merge.practice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Request body for {@code POST /api/v1/drills/{id}/submit}.
 *
 * <p>{@code idempotencyKey} is required so that network retries do not produce duplicate
 * processed submissions. The server will short-circuit any request that supplies an
 * idempotency key already present on a resolved Drill.</p>
 *
 * <p>{@code pasteAttempted} and {@code tabFocusLost} are evidence fields only. The server
 * records them regardless of outcome and never uses them to block or alter a submission.
 * Both are required in the request so the client contract is explicit — the client must
 * always report what it observed, even if nothing happened ({@code false} / {@code 0}).</p>
 */
public record SubmitDrillRequest(
        @NotBlank(message = "answer is required")
        String answer,

        @NotBlank(message = "idempotencyKey is required")
        String idempotencyKey,

        @NotNull(message = "pasteAttempted is required")
        Boolean pasteAttempted,

        @NotNull(message = "tabFocusLost is required")
        @PositiveOrZero(message = "tabFocusLost must be zero or positive")
        Integer tabFocusLost
) {}
