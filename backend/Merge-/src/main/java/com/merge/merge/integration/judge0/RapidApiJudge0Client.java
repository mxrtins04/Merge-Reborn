package com.merge.merge.integration.judge0;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiter;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.concurrent.Callable;
import java.util.function.Supplier;

@Component
@Profile({"dev", "prod"})
@Slf4j
public class RapidApiJudge0Client implements Judge0Client {

    private static final String JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions?wait=true";
    private static final int JAVA_LANGUAGE_ID = 91;
    private static final String INSTANCE_NAME = "judge0-client";

    private final WebClient webClient;
    private final String apiKey;
    private final CircuitBreaker circuitBreaker;
    private final Retry retry;
    private final TimeLimiter timeLimiter;

    public RapidApiJudge0Client(
            @Value("${rapidapi.key:}") String apiKey,
            CircuitBreakerRegistry circuitBreakerRegistry,
            RetryRegistry retryRegistry,
            TimeLimiterRegistry timeLimiterRegistry
    ) {
        this.webClient = WebClient.create();
        this.apiKey = apiKey;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker(INSTANCE_NAME);
        this.retry = retryRegistry.retry(INSTANCE_NAME);
        this.timeLimiter = timeLimiterRegistry.timeLimiter(INSTANCE_NAME);
    }

    @Override
    public Judge0Result evaluate(String sourceCode, String testSuite) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RAPIDAPI_KEY is not configured. Returning execution failure.");
            return new Judge0Result(false, null, "RapidAPI key (RAPIDAPI_KEY) is missing.", null);
        }

        String combinedCode = sourceCode + "\n" + testSuite;

        Supplier<java.util.concurrent.CompletableFuture<Judge0Result>> futureSupplier = () ->
            webClient.post()
                .uri(JUDGE0_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-RapidAPI-Key", apiKey)
                .header("X-RapidAPI-Host", "judge0-ce.p.rapidapi.com")
                .bodyValue(Map.of("source_code", combinedCode, "language_id", JAVA_LANGUAGE_ID))
                .retrieve()
                .onStatus(
                    status -> status.value() == 429,
                    response -> {
                        log.error("================================================================");
                        log.error("LOUD ALARM: RapidAPI Judge0 rate limit hit — HTTP 429.");
                        log.error("Daily free-tier quota (50 req/day) has been exhausted.");
                        log.error("No further builds can be evaluated until quota resets.");
                        log.error("Action required: upgrade the RapidAPI plan or self-host Judge0.");
                        log.error("================================================================");
                        return Mono.error(new Judge0RateLimitException());
                    }
                )
                .bodyToMono(Judge0Response.class)
                .map(res -> {
                    if (res == null) throw new IllegalStateException("Null response from Judge0 API");
                    boolean passed = res.status() != null && res.status().id() == 3;
                    return new Judge0Result(passed, res.stdout(), res.stderr(), res.compile_output());
                })
                .doOnError(
                    e -> !(e instanceof Judge0RateLimitException),
                    e -> log.error("Judge0 API call failed: {}", e.getMessage())
                )
                .toFuture();

        Callable<Judge0Result> timeLimited = TimeLimiter.decorateFutureSupplier(timeLimiter, futureSupplier);
        Callable<Judge0Result> withCb = CircuitBreaker.decorateCallable(circuitBreaker, timeLimited);
        Callable<Judge0Result> withRetry = Retry.decorateCallable(retry, withCb);

        try {
            return withRetry.call();
        } catch (Judge0RateLimitException e) {
            return new Judge0Result(false, null, e.getMessage(), null);
        } catch (Exception e) {
            log.error("Judge0 resilience-wrapped call failed: {}", e.getMessage());
            return new Judge0Result(false, null, "Execution failed: " + e.getMessage(), null);
        }
    }
}
