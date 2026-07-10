package com.merge.merge.identity.dto;

import jakarta.validation.constraints.NotBlank;

public record CredentialRequest(
        @NotBlank(message = "token must not be blank")
        String token
) {}
