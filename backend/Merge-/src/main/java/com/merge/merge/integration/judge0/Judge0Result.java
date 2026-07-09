package com.merge.merge.integration.judge0;

public record Judge0Result(
        boolean passed,
        String stdout,
        String stderr,
        String compileOutput
) {}
