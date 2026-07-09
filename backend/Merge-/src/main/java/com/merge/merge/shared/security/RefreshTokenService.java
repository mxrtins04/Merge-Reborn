package com.merge.merge.shared.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

/**
 * Refresh tokens live in Redis, not Mongo: they are ephemeral session state
 * with a natural TTL fit, not domain data.
 *
 * <p>Rotation-with-reuse-detection (OWASP pattern): a valid token maps
 * refresh_token:{tokenId} -> "{studentId}". On rotation the old key is not
 * deleted outright, it is overwritten to a short-lived tombstone
 * "USED:{studentId}" instead. If that tombstoned id is ever presented again,
 * we can still recover which student to revoke, and treat it as a signal of
 * possible token theft: every token in student_tokens:{studentId} is
 * revoked, forcing full re-login. A plain delete-on-rotate would lose that
 * linkage the moment the old key was gone, making reuse detection
 * impossible to act on.</p>
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    static final Duration REFRESH_TOKEN_TTL = Duration.ofDays(30);
    static final Duration TOMBSTONE_TTL = Duration.ofMinutes(5);
    private static final String USED_PREFIX = "USED:";

    private final StringRedisTemplate redisTemplate;

    public String issue(UUID studentId) {
        String tokenId = UUID.randomUUID().toString();
        store(tokenId, studentId);
        return tokenId;
    }

    /**
     * @return the new refresh token id, and the studentId it was issued for
     * @throws InvalidRefreshTokenException if the token is unknown, expired, or was already rotated
     */
    public Rotated rotate(String tokenId) {
        String key = tokenKey(tokenId);
        String value = redisTemplate.opsForValue().get(key);

        if (value == null) {
            throw new InvalidRefreshTokenException("Unknown or expired refresh token");
        }

        if (value.startsWith(USED_PREFIX)) {
            UUID studentId = UUID.fromString(value.substring(USED_PREFIX.length()));
            revokeAll(studentId);
            // Throw TokenReuseDetectedException specifically so the GlobalExceptionHandler
            // can treat this as a security event distinct from a routine expiry.
            throw new TokenReuseDetectedException(
                    "Refresh token reuse detected, all sessions for this student have been revoked");
        }

        UUID studentId = UUID.fromString(value);
        redisTemplate.opsForSet().remove(studentTokensKey(studentId), tokenId);
        redisTemplate.opsForValue().set(key, USED_PREFIX + studentId, TOMBSTONE_TTL);

        String newTokenId = UUID.randomUUID().toString();
        store(newTokenId, studentId);
        return new Rotated(newTokenId, studentId);
    }

    public void revoke(String tokenId) {
        String key = tokenKey(tokenId);
        String value = redisTemplate.opsForValue().get(key);
        if (value != null && !value.startsWith(USED_PREFIX)) {
            UUID studentId = UUID.fromString(value);
            redisTemplate.opsForSet().remove(studentTokensKey(studentId), tokenId);
        }
        redisTemplate.delete(key);
    }

    public void revokeAll(UUID studentId) {
        String setKey = studentTokensKey(studentId);
        Set<String> tokenIds = redisTemplate.opsForSet().members(setKey);
        if (tokenIds != null) {
            tokenIds.forEach(id -> redisTemplate.delete(tokenKey(id)));
        }
        redisTemplate.delete(setKey);
    }

    private void store(String tokenId, UUID studentId) {
        redisTemplate.opsForValue().set(tokenKey(tokenId), studentId.toString(), REFRESH_TOKEN_TTL);
        redisTemplate.opsForSet().add(studentTokensKey(studentId), tokenId);
    }

    private static String tokenKey(String tokenId) {
        return "refresh_token:" + tokenId;
    }

    private static String studentTokensKey(UUID studentId) {
        return "student_tokens:" + studentId;
    }

    public record Rotated(String newTokenId, UUID studentId) {
    }
}
