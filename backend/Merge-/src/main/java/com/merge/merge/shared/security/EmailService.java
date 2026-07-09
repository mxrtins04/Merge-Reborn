package com.merge.merge.shared.security;

/**
 * The real provider (SendGrid or otherwise) is still being evaluated
 * separately and is not part of this build. LoggingEmailService is the only
 * implementation for now.
 */
public interface EmailService {
    void send(String to, String subject, String body);
}
