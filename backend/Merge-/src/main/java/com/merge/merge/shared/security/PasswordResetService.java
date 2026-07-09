package com.merge.merge.shared.security;

import com.merge.merge.identity.models.Student;
import com.merge.merge.identity.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Reset tokens are opaque random values, not JWTs: they need to be genuinely
 * single-use, which a self-contained signed token can't guarantee on its own
 * without also tracking used tokens somewhere, so we may as well make Redis
 * the source of truth from the start. The raw token is hashed (SHA-256, not
 * bcrypt: the token itself is 128+ bits of random entropy, not a
 * human-guessable secret, so a slow adaptive hash buys nothing here) before
 * storage, so a Redis dump doesn't hand out live reset tokens directly.
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(20);
    private static final String KEY_PREFIX = "password_reset:";

    private final StringRedisTemplate redisTemplate;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /**
     * Silently no-ops if the email doesn't correspond to an account, so the
     * controller can always return the same generic response and avoid
     * leaking which emails are registered.
     */
    public void requestReset(String email) {
        studentRepository.findByEmail(email).ifPresent(student -> {
            String rawToken = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set(KEY_PREFIX + hash(rawToken),
                    student.getId().toString(), RESET_TOKEN_TTL);
            emailService.send(email, "Reset your Merge password",
                    "Use this token to reset your password: " + rawToken
                            + "\nThis token expires in 20 minutes and can only be used once.");
        });
    }

    /**
     * @throws InvalidResetTokenException if the token is unknown, expired, or already used
     */
    public void confirmReset(String rawToken, String newPassword) {
        String key = KEY_PREFIX + hash(rawToken);
        String studentIdValue = redisTemplate.opsForValue().get(key);
        if (studentIdValue == null) {
            throw new InvalidResetTokenException("Unknown or expired reset token");
        }
        redisTemplate.delete(key);

        UUID studentId = UUID.fromString(studentIdValue);
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new InvalidResetTokenException("No account for this reset token"));
        student.changePassword(passwordEncoder.encode(newPassword));
        studentRepository.save(student);
    }

    private static String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
