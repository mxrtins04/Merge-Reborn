package com.merge.merge.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.identity.repository.StudentRepository;
import com.merge.merge.identity.service.AuthService;
import com.merge.merge.identity.service.StudentService;
import com.merge.merge.project.model.ProjectStatus;
import com.merge.merge.project.repository.ProjectRepository;
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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectControllerTest {

    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    @Autowired private AuthService authService;
    @Autowired private StudentService studentService;
    @Autowired private StudentRepository studentRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private StringRedisTemplate redisTemplate;

    @AfterEach
    void cleanUp() {
        projectRepository.deleteAll();
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

    @Test
    void testProjectLifecycle_Submit_Get_Approve_VerifyEligibility() throws Exception {
        String token = registerAndLogin("alice@example.com", "securepass123", "Alice");

        // 1. Submit Project
        MvcResult submitResult = mockMvc.perform(post("/api/v1/projects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "given": "Build Modular Monolith",
                                  "link": "https://github.com/alice/merge",
                                  "prd": "Standard spec"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.given").value("Build Modular Monolith"))
                .andReturn();

        String projectIdStr = objectMapper.readTree(submitResult.getResponse().getContentAsString())
                .get("id").asText();
        UUID projectId = UUID.fromString(projectIdStr);

        // Verify Student is not eligible yet
        mockMvc.perform(get("/api/v1/students/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.internshipEligible").value(false));

        // 2. Fetch Project by ID
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectIdStr))
                .andExpect(jsonPath("$.status").value("PENDING"));

        // 3. Get Student's Projects
        mockMvc.perform(get("/api/v1/projects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(projectIdStr));

        // 4. Update status to APPROVED (Transition status)
        mockMvc.perform(put("/api/v1/projects/" + projectId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "APPROVED",
                                  "review": "Awesome job, approved!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.review").value("Awesome job, approved!"));

        // 5. Verify Student's internshipEligible has flipped to true
        mockMvc.perform(get("/api/v1/students/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.internshipEligible").value(true));
    }
}
