package com.merge.merge.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.identity.models.Credential;
import com.merge.merge.identity.models.Student;
import com.merge.merge.identity.repository.CredentialRepository;
import com.merge.merge.identity.service.CredentialService;
import com.merge.merge.identity.service.TokenEncryptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
class CredentialServiceTest {

    @Autowired
    private CredentialService credentialService;

    @Autowired
    private CredentialRepository credentialRepository;

    @Autowired
    private TokenEncryptionService encryptionService;

    @Autowired
    private MongoTemplate mongoTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String ENCRYPTION_KEY = Base64.getEncoder().encodeToString(new byte[32]); // 32 bytes of zeros

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("ENCRYPTION_KEY", () -> ENCRYPTION_KEY);
    }

    @BeforeEach
    void cleanUp() {
        credentialRepository.deleteAll();
    }

    @Test
    void storeAndGetDecryptedTokenRoundtrip() {
        UUID studentId = UUID.randomUUID();
        String originalToken = "gemini-api-key-123";

        credentialService.storeToken(studentId, CredentialService.TokenType.GEMINI, originalToken);
        String decrypted = credentialService.getDecryptedToken(studentId, CredentialService.TokenType.GEMINI);

        assertThat(decrypted).isEqualTo(originalToken);
    }

    @Test
    void storeUpsertsExistingCredential() {
        UUID studentId = UUID.randomUUID();
        
        credentialService.storeToken(studentId, CredentialService.TokenType.GEMINI, "token-v1");
        credentialService.storeToken(studentId, CredentialService.TokenType.GEMINI, "token-v2");
        credentialService.storeToken(studentId, CredentialService.TokenType.GITHUB, "gh-token");

        Credential credential = credentialRepository.findByStudentId(studentId).orElseThrow();
        assertThat(credentialRepository.count()).isEqualTo(1);
        assertThat(credentialService.getDecryptedToken(studentId, CredentialService.TokenType.GEMINI)).isEqualTo("token-v2");
        assertThat(credentialService.getDecryptedToken(studentId, CredentialService.TokenType.GITHUB)).isEqualTo("gh-token");
    }

    @Test
    void directMongoInspectionShowsEncryptedData() {
        UUID studentId = UUID.randomUUID();
        String originalToken = "secret-token";

        credentialService.storeToken(studentId, CredentialService.TokenType.GEMINI, originalToken);

        Credential rawDoc = mongoTemplate.findOne(
                org.springframework.data.mongodb.core.query.Query.query(
                        org.springframework.data.mongodb.core.query.Criteria.where("studentId").is(studentId)),
                Credential.class);

        assertThat(rawDoc.getGeminiTokenEncrypted()).isNotEqualTo(originalToken);
        assertThat(encryptionService.decrypt(rawDoc.getGeminiTokenEncrypted())).isEqualTo(originalToken);
    }

    @Test
    void decryptionFailureDoesNotLeakSensitiveInfo() {
        // We create a corrupted ciphertext by changing one byte
        String originalToken = "top-secret";
        String encrypted = encryptionService.encrypt(originalToken);
        byte[] decoded = Base64.getDecoder().decode(encrypted);
        decoded[decoded.length - 1] ^= 0x01; // Corrupt the authentication tag
        String corrupted = Base64.getEncoder().encodeToString(decoded);

        assertThatThrownBy(() -> encryptionService.decrypt(corrupted))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Decryption failed")
                .satisfies(e -> {
                    String msg = e.getMessage();
                    assertThat(msg).doesNotContain(originalToken);
                    assertThat(msg).doesNotContain(ENCRYPTION_KEY);
                    assertThat(msg).doesNotContain(corrupted);
                });
    }

    @Test
    void studentSerializationDoesNotLeakCredentials() throws Exception {
        UUID studentId = UUID.randomUUID();
        Student student = new Student(studentId, "Test Student", "Details", UUID.randomUUID());
        
        credentialService.storeToken(studentId, CredentialService.TokenType.GEMINI, "secret-gemini-token");

        String json = objectMapper.writeValueAsString(student);
        
        // Ensure student JSON doesn't contain credential fields or tokens
        assertThat(json).doesNotContain("geminiTokenEncrypted");
        assertThat(json).doesNotContain("githubTokenEncrypted");
        assertThat(json).doesNotContain("secret-gemini-token");
    }
}
