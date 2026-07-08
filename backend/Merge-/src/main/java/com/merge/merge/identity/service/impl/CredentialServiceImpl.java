package com.merge.merge.identity.service.impl;

import com.merge.merge.identity.models.Credential;
import com.merge.merge.identity.repository.CredentialRepository;
import com.merge.merge.identity.service.CredentialService;
import com.merge.merge.identity.service.TokenEncryptionService;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class CredentialServiceImpl implements CredentialService {

    private final CredentialRepository credentialRepository;
    private final TokenEncryptionService encryptionService;

    public CredentialServiceImpl(CredentialRepository credentialRepository, TokenEncryptionService encryptionService) {
        this.credentialRepository = credentialRepository;
        this.encryptionService = encryptionService;
    }

    @Override
    public void storeToken(UUID studentId, TokenType type, String token) {
        Credential credential = credentialRepository.findByStudentId(studentId)
                .orElseGet(() -> new Credential(studentId));

        String encrypted = encryptionService.encrypt(token);

        if (type == TokenType.GEMINI) {
            credential.setGeminiTokenEncrypted(encrypted);
        } else if (type == TokenType.GITHUB) {
            credential.setGithubTokenEncrypted(encrypted);
        }

        credentialRepository.save(credential);
    }

    @Override
    public String getDecryptedToken(UUID studentId, TokenType type) {
        Credential credential = credentialRepository.findByStudentId(studentId)
                .orElseThrow(() -> new NoSuchElementException("No credentials for student " + studentId));

        String encrypted = (type == TokenType.GEMINI) 
                ? credential.getGeminiTokenEncrypted() 
                : credential.getGithubTokenEncrypted();

        if (encrypted == null) {
            throw new NoSuchElementException("Token not found for type " + type);
        }

        return encryptionService.decrypt(encrypted);
    }
}
