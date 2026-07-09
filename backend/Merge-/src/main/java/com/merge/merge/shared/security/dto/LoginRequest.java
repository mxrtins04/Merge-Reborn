package com.merge.merge.shared.security.dto;

import com.merge.merge.shared.security.HasEmail;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @NotBlank
        @Email
        String email,

        @NotBlank
        String password

) implements HasEmail {
}
