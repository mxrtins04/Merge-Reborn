package com.merge.merge.shared.security.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PasswordReset(

        @NotBlank
        String token,

        @NotBlank
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d).{12,72}$",
                message = "newPassword must be 12-72 characters and contain at least one letter and one digit"
        )
        String newPassword

) {
}
