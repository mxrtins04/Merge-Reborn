package com.merge.merge.identity.service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenEncryptionService {

    private final byte[] key;
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;
    private final SecureRandom secureRandom = new SecureRandom();

    public TokenEncryptionService(@Value("${encryption.key}") String encryptionKeyBase64) {
        try {
            this.key = Base64.getDecoder().decode(encryptionKeyBase64);
            if (this.key.length != 32) {
                throw new IllegalArgumentException("ENCRYPTION_KEY must be 32 bytes for AES-256");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize encryption key from environment", e);
        }
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] iv = new byte[IV_LENGTH_BYTE];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes());
            
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);
            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed");
        }
    }

    public String decrypt(String encryptedText) {
        if (encryptedText == null) return null;
        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedText);
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[IV_LENGTH_BYTE];
            byteBuffer.get(iv);
            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            return new String(cipher.doFinal(ciphertext));
        } catch (Exception e) {
            // Requirement: no part of key, ciphertext, or token in exception message
            throw new RuntimeException("Decryption failed");
        }
    }
}
