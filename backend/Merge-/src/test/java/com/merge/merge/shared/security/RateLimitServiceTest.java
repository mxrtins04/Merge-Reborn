package com.merge.merge.shared.security;

import com.merge.merge.TestcontainersConfiguration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class RateLimitServiceTest {

    @Autowired
    private RateLimitService rateLimitService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @AfterEach
    void cleanUp() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
    }

    @Test
    void allowsUpToTheLimitThenBlocksTheNextAttempt() {
        String key = "test:" + UUID.randomUUID();

        for (int i = 0; i < 5; i++) {
            assertThatCode(() -> rateLimitService.checkAndIncrement(key, 5, 900)).doesNotThrowAnyException();
        }

        assertThatThrownBy(() -> rateLimitService.checkAndIncrement(key, 5, 900))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void separateKeysHaveIndependentBudgets() {
        String keyA = "test:" + UUID.randomUUID();
        String keyB = "test:" + UUID.randomUUID();

        for (int i = 0; i < 5; i++) {
            rateLimitService.checkAndIncrement(keyA, 5, 900);
        }

        assertThatCode(() -> rateLimitService.checkAndIncrement(keyB, 5, 900)).doesNotThrowAnyException();
    }
}
