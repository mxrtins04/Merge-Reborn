package com.merge.merge.integration.judge0;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"test", "default"})
@Slf4j
public class MockJudge0Client implements Judge0Client {
    @Override
    public Judge0Result evaluate(String sourceCode, String testSuite) {
        log.info("Executing MockJudge0Client. Returns PASSED simulated results.");
        return new Judge0Result(true, "Mock stdout output", null, null);
    }
}
