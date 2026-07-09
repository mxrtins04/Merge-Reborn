package com.merge.merge.shared.security;

import com.merge.merge.identity.models.Student;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Wraps Student as the framework-required UserDetails, exposing studentId so
 * callers past authentication don't need a second lookup.
 *
 * <p>getPassword() returns Student.passwordHash. DaoAuthenticationProvider
 * calls this during authentication and compares it against the raw password
 * via PasswordEncoder. The hash is never returned in any response DTO —
 * StudentResponse.from() lists fields explicitly and omits it.</p>
 */
public class AuthenticatedUser implements UserDetails {

    private final Student student;

    public AuthenticatedUser(Student student) {
        this.student = student;
    }

    public UUID getStudentId() {
        return student.getId();
    }

    @Override
    public String getUsername() {
        return student.getEmail();
    }

    @Override
    public String getPassword() {
        return student.getPasswordHash();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }
}
