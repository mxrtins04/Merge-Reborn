package com.merge.merge.shared.security;

/**
 * Thrown when a refresh token that has already been rotated is presented
 * again. This is treated as a possible token-theft signal: the caller's
 * entire active token set is revoked before this exception propagates.
 *
 * <p>Distinct from {@link InvalidRefreshTokenException} (unknown or expired
 * token) so the GlobalExceptionHandler and logging can treat a reuse event
 * differently from a routine expiry, e.g. for alerting.</p>
 */
public class TokenReuseDetectedException extends RuntimeException {

    public TokenReuseDetectedException(String message) {
        super(message);
    }
}
