package com.merge.merge.shared.security;

/**
 * Implemented by request DTOs that carry an email, so RateLimitAspect can
 * key a rate limit by email without reflecting on arbitrary DTO shapes.
 */
public interface HasEmail {
    String email();
}
