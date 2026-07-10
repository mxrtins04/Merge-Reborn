package com.merge.merge.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merge.merge.TestcontainersConfiguration;
import com.merge.merge.identity.repository.StudentRepository;
import com.merge.merge.identity.service.AuthService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.ArrayList;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class SessionControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private AuthService authService;
    @Autowired private StudentRepository studentRepository;
    @Autowired private StringRedisTemplate redisTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        sessionRepository.deleteAll();
    }

    @AfterEach
    void cleanUp() {
        sessionRepository.deleteAll();
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

    private UUID studentId(String email) {
        return studentRepository.findByEmail(email).orElseThrow().getId();
    }

    // -------------------------------------------------------------------------
    // 401 — unauthenticated requests
    // -------------------------------------------------------------------------

    @Test
    void endSession_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/sessions/{id}/end", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"NAVIGATED_AWAY\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void endSession_invalidToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/sessions/{id}/end", UUID.randomUUID())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not.a.real.jwt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"NAVIGATED_AWAY\"}"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // Successful end
    // -------------------------------------------------------------------------

    @Test
    void post_sessions_id_end_navigated_away_returns_200() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");
        Session session = savedOpenSession(studentId("ada@example.com"), Mood.FRESH);

        mockMvc.perform(post("/api/v1/sessions/{id}/end", session.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"NAVIGATED_AWAY\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endReason").value("NAVIGATED_AWAY"))
                .andExpect(jsonPath("$.endedAt").isNotEmpty());
    }

    @Test
    void post_sessions_id_end_exhausted_returns_200() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");
        Session session = savedOpenSession(studentId("ada@example.com"), Mood.EXHAUSTED);

        mockMvc.perform(post("/api/v1/sessions/{id}/end", session.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"EXHAUSTED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endReason").value("EXHAUSTED"))
                .andExpect(jsonPath("$.endedAt").isNotEmpty());
    }

    // -------------------------------------------------------------------------
    // Bad request — non-client-settable reasons
    // -------------------------------------------------------------------------

    @Test
    void post_sessions_id_end_rejects_completed_reason_with_400() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");
        Session session = savedOpenSession(studentId("ada@example.com"), Mood.FRESH);

        mockMvc.perform(post("/api/v1/sessions/{id}/end", session.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"COMPLETED\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void post_sessions_id_end_rejects_idle_timeout_reason_with_400() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");
        Session session = savedOpenSession(studentId("ada@example.com"), Mood.FRESH);

        mockMvc.perform(post("/api/v1/sessions/{id}/end", session.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"IDLE_TIMEOUT\"}"))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // 404 — unknown session, or session owned by a different student
    // -------------------------------------------------------------------------

    @Test
    void post_sessions_id_end_returns_404_for_unknown_id() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");

        mockMvc.perform(post("/api/v1/sessions/{id}/end", UUID.randomUUID())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"NAVIGATED_AWAY\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void post_sessions_id_end_returns_404_for_session_owned_by_different_student() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");
        // Session belongs to a different (unregistered) student UUID
        Session session = savedOpenSession(UUID.randomUUID(), Mood.FRESH);

        mockMvc.perform(post("/api/v1/sessions/{id}/end", session.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"NAVIGATED_AWAY\"}"))
                .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // 409 — already ended
    // -------------------------------------------------------------------------

    @Test
    void post_sessions_id_end_returns_409_for_already_ended_session() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");
        Session session = savedOpenSession(studentId("ada@example.com"), Mood.FRESH);

        // Close once
        mockMvc.perform(post("/api/v1/sessions/{id}/end", session.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"NAVIGATED_AWAY\"}"))
                .andExpect(status().isOk());

        // Close again — should be 409
        mockMvc.perform(post("/api/v1/sessions/{id}/end", session.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"NAVIGATED_AWAY\"}"))
                .andExpect(status().isConflict());
    }

    // -------------------------------------------------------------------------
    // Persistence
    // -------------------------------------------------------------------------

    @Test
    void post_sessions_id_end_persists_endedAt_in_database() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");
        UUID sid = studentId("ada@example.com");
        Session session = savedOpenSession(sid, Mood.OKAY);

        mockMvc.perform(post("/api/v1/sessions/{id}/end", session.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"NAVIGATED_AWAY\"}"))
                .andExpect(status().isOk());

        Session persisted = sessionRepository.findById(session.getId()).orElseThrow();
        assertThat(persisted.getEndedAt()).isNotNull();
        assertThat(persisted.getEndReason()).isEqualTo(EndReason.NAVIGATED_AWAY);
        assertThat(sessionRepository.findByStudentIdAndEndedAtIsNull(sid)).isEmpty();
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    private Session savedOpenSession(UUID studentId, Mood mood) {
        Session s = Session.builder()
                .id(UUID.randomUUID())
                .studentId(studentId)
                .mood(mood)
                .type(SessionService.deriveType(mood))
                .lastActivityAt(Instant.now())
                .path(new ArrayList<>())
                .build();
        return sessionRepository.save(s);
    }

    // -------------------------------------------------------------------------
    // GET /api/v1/sessions/active
    // -------------------------------------------------------------------------

    @Test
    void getActiveSession_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/active"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getActiveSession_noActiveSessionExists_returns404() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");

        mockMvc.perform(get("/api/v1/sessions/active")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void getActiveSession_activeSessionExists_returns200() throws Exception {
        String token = registerAndLogin("ada@example.com", "correcthorse123", "Ada");
        UUID sid = studentId("ada@example.com");
        Session session = savedOpenSession(sid, Mood.FRESH);

        mockMvc.perform(get("/api/v1/sessions/active")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(session.getId().toString()))
                .andExpect(jsonPath("$.studentId").value(sid.toString()))
                .andExpect(jsonPath("$.mood").value("FRESH"))
                .andExpect(jsonPath("$.endedAt").isEmpty());
    }
}
