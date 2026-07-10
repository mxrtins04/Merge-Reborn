package com.merge.merge.session;

/**
 * Request body for {@code POST /api/v1/sessions}.
 */
public record StartSessionRequest(Mood mood) {
}
