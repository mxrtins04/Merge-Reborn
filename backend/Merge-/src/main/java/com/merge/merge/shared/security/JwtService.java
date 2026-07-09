package com.merge.merge.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * HS256 access token issuance and validation. Merge is the sole issuer and
 * sole verifier in this modular monolith, so a symmetric key is sufficient;
 * there is no second service that needs to verify tokens independently.
 */
@Service
public class JwtService {

    public static final Duration ACCESS_TOKEN_TTL = Duration.ofMinutes(15);

    private final SecretKey signingKey;

    public JwtService(@Value("${jwt.signing-key}") String signingKeyBase64) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(signingKeyBase64));
    }

    public String issueAccessToken(UUID studentId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(studentId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ACCESS_TOKEN_TTL)))
                .signWith(signingKey)
                .compact();
    }

    /**
     * @throws JwtException if the token is malformed, expired, or fails signature verification
     */
    public UUID validateAndExtractStudentId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return UUID.fromString(claims.getSubject());
    }
}
