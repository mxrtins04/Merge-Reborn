package com.merge.merge.project.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateProjectRequest(
    @NotBlank(message = "given must not be blank") String given,
    @NotBlank(message = "link must not be blank") String link,
    @NotBlank(message = "prd must not be blank") String prd
) {}
