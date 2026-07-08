package com.merge.merge.identity.service;

import java.util.UUID;

public interface CredentialService {
    enum TokenType {
        GEMINI, GITHUB
    }

    void storeToken(UUID studentId, TokenType type, String token);

    String getDecryptedToken(UUID studentId, TokenType type);
}
