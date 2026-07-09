package com.merge.merge.shared.security.dto;

/**
 * Never carries passwordHash or any auth-only field from Student. The refresh
 * token is not here: it goes out as an HttpOnly cookie, not in the response body.
 */
public record AuthResponse(String accessToken, long expiresIn) {
}
