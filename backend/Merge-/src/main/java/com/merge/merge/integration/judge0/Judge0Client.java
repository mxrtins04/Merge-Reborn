package com.merge.merge.integration.judge0;

public interface Judge0Client {
    /**
     * Submits code and test suite to Judge0 compiler for evaluation.
     */
    Judge0Result evaluate(String sourceCode, String testSuite);
}
