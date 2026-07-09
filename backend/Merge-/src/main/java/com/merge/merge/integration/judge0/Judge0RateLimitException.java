package com.merge.merge.integration.judge0;

class Judge0RateLimitException extends RuntimeException {
    Judge0RateLimitException() {
        super("RATE_LIMIT_EXCEEDED: RapidAPI Judge0 daily quota exhausted (HTTP 429)");
    }
}
