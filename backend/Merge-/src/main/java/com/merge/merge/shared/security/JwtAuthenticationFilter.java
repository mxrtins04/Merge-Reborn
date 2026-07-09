package com.merge.merge.shared.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Trusts the access token's signature and expiry directly rather than
 * re-querying UserDetailsService on every request. This is the standard
 * stateless JWT pattern: the token is short-lived (15 minutes) and
 * self-contained, so a DB round trip per request buys freshness we don't
 * need at this cost. Login itself still goes through the full
 * UserDetailsService plus PasswordEncoder verification.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                UUID studentId = jwtService.validateAndExtractStudentId(token);
                var authentication = new UsernamePasswordAuthenticationToken(studentId, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException e) {
                // Invalid or expired token: leave the context unauthenticated
                // rather than reject here, so public endpoints on the same
                // filter chain still work. Protected endpoints will 401
                // via the normal Spring Security entry point.
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
