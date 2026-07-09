package com.merge.merge.shared.security.dto;

import com.merge.merge.shared.security.HasEmail;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RegisterRequest(

        @NotBlank
        @Email
        String email,

        @NotBlank
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d).{12,72}$",
                message = "password must be 12-72 characters and contain at least one letter and one digit"
        )
        String password,

        @NotBlank
        String name

) implements HasEmail {
}
