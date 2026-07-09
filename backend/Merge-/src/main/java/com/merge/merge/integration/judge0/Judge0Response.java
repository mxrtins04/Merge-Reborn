package com.merge.merge.integration.judge0;

public record Judge0Response(
        String stdout,
        String stderr,
        String compile_output,
        String message,
        int exit_code,
        Status status
) {
    public record Status(
            int id,
            String description
    ) {}
}
