package com.merge.merge.shared.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Fixed-window counter via a Lua script executed atomically on the Redis server.
 * INCR and EXPIRE are a single EVAL call, so there is no crash window between
 * the two commands that would leave a key without a TTL.
 */
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private static final RedisScript<Long> INCREMENT_WITH_TTL = RedisScript.of(
            """
            local count = redis.call('INCR', KEYS[1])
            if count == 1 then
              redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return count
            """,
            Long.class);

    private final StringRedisTemplate redisTemplate;

    /**
     * @throws RateLimitExceededException once the count for this key exceeds the limit within the window
     */
    public void checkAndIncrement(String key, int limit, long windowSeconds) {
        Long count = redisTemplate.execute(INCREMENT_WITH_TTL, List.of(key), String.valueOf(windowSeconds));
        if (count != null && count > limit) {
            throw new RateLimitExceededException("Rate limit exceeded for " + key);
        }
    }
}
