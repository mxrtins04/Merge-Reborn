package com.merge.merge.identity.dto;

import com.merge.merge.identity.models.Motivation;
import com.merge.merge.identity.models.PreferredLanguage;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OnboardingRequest(
        @NotNull(message = "yearsOfExperience must not be null")
        @Min(value = 0, message = "yearsOfExperience must be at least 0")
        Integer yearsOfExperience,

        @NotNull(message = "preferredLanguage must not be null")
        PreferredLanguage preferredLanguage,

        @NotNull(message = "motivation must not be null")
        Motivation motivation
) {}
