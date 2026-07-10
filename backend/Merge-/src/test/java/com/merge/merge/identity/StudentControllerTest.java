package com.merge.merge.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.identity.repository.EProfileRepository;
import com.merge.merge.identity.repository.StudentRepository;
import com.merge.merge.identity.service.AuthService;
import com.merge.merge.identity.service.EProfileService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StudentControllerTest {

    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    @Autowired private AuthService authService;
    @Autowired private EProfileService eProfileService;
    @Autowired private StudentRepository studentRepository;
    @Autowired private EProfileRepository eProfileRepository;
    @Autowired private StringRedisTemplate redisTemplate;

    @AfterEach
    void cleanUp() {
        eProfileRepository.deleteAll();
        studentRepository.deleteAll();
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
    }

    private String registerAndLogin(String email, String password, String name) throws Exception {
        authService.register(email, password, name);
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.strip().formatted(email, password)))
                .andReturn();
        return objectMapper.readTree(login.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    // -------------------------------------------------------------------
    // GET /api/v1/students/me
    // -------------------------------------------------------------------

    @Test
    void me_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/students/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_invalidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/students/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not.a.real.jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_validToken_returns200_withDtoFields_andNoPasswordHash() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");

        MvcResult result = mockMvc.perform(get("/api/v1/students/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ada"))
                .andExpect(jsonPath("$.xp").value(0))
                .andExpect(jsonPath("$.internshipEligible").value(false))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        // Core no-leak assertion: passwordHash must not appear anywhere in the response.
        assertThat(body).doesNotContain("passwordHash");
        // email is also not in StudentResponse — auth data stays auth data.
        assertThat(body).doesNotContain("email");
    }

    // -------------------------------------------------------------------
    // GET /api/v1/students/me/profile
    // -------------------------------------------------------------------

    @Test
    void meProfile_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/students/me/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meProfile_noProfileExists_returns404WithProblemDetailShape() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");

        MvcResult result = mockMvc.perform(get("/api/v1/students/me/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNotFound())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        // Must come through GlobalExceptionHandler — consistent ProblemDetail shape.
        assertThat(body).contains("\"title\"");
        assertThat(body).contains("\"detail\"");
        assertThat(body).doesNotContain("stackTrace");
        assertThat(body).doesNotContain("exception");
    }

    @Test
    void meProfile_profileExists_returns200() throws Exception {
        authService.register("ada@example.com", "correcthorse123", "Ada");
        var student = studentRepository.findByEmail("ada@example.com").orElseThrow();
        eProfileService.createForStudent(student.getId());

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"ada@example.com","password":"correcthorse123"}
                                """.strip()))
                .andReturn();
        String token = objectMapper.readTree(login.getResponse().getContentAsString())
                .get("accessToken").asText();

        MvcResult result = mockMvc.perform(get("/api/v1/students/me/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentId").isNotEmpty())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).doesNotContain("passwordHash");
    }

    // -------------------------------------------------------------------
    // POST /api/v1/students/me/onboarding
    // -------------------------------------------------------------------

    @Test
    void onboard_validPayload_returns200_andSavesToContext() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");

        mockMvc.perform(post("/api/v1/students/me/onboarding")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "yearsOfExperience": 3,
                                  "preferredLanguage": "JAVA",
                                  "motivation": "JOB"
                                }
                                """.strip()))
                .andExpect(status().isOk());

        // A second submission should be rejected (400 Bad Request)
        mockMvc.perform(post("/api/v1/students/me/onboarding")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "yearsOfExperience": 5,
                                  "preferredLanguage": "PYTHON",
                                  "motivation": "CURIOSITY"
                                }
                                """.strip()))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------
    // POST /api/v1/students/me/credentials
    // -------------------------------------------------------------------

    @Test
    void submitCredentials_validPayload_returns200() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");

        mockMvc.perform(post("/api/v1/students/me/credentials")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "secret-gemini-api-key"
                                }
                                """.strip()))
                .andExpect(status().isOk());
    }
}
