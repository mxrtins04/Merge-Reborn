package com.merge.merge.integration.gemini;

import com.merge.merge.shared.security.RateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Client for invoking Gemini API generateContent endpoints.
 */
@Component
@Slf4j
public class GeminiClient {

    private final RestTemplate restTemplate;
    private final String model;

    public GeminiClient(
            @Value("${gemini.model:gemini-3.1-flash-lite}") String model) {
        this.restTemplate = new RestTemplate();
        this.model = model;
    }

    /**
     * Sends a generation request to the Gemini API.
     * If the API key is set to "mock" or is blank, returns a mock response.
     */
    public String generate(String prompt, String apiKey) {
        if ("mock".equalsIgnoreCase(apiKey) || apiKey.isBlank()) {
            log.info("Gemini API key is mock or blank. Returning fallback mock response.");
            if (prompt.contains("PASS or FAIL")) {
                return "PASS";
            }
            if (prompt.contains("SCORE:")) {
                return "SCORE: 85\nFEEDBACK: Mock clean code review feedback";
            }
            return "Mock Gemini response for prompt: " + prompt;
        }

        String url = String.format("https://generativelanguage.googleapis.com/v1/models/%s:generateContent?key=%s", model, apiKey);

        GeminiRequest request = GeminiRequest.builder()
                .contents(List.of(GeminiRequest.Content.builder()
                        .parts(List.of(GeminiRequest.Part.builder()
                                .text(prompt)
                                .build()))
                        .build()))
                .build();

        try {
            GeminiResponse response = restTemplate.postForObject(url, request, GeminiResponse.class);
            if (response != null && response.getCandidates() != null && !response.getCandidates().isEmpty()) {
                GeminiResponse.Candidate candidate = response.getCandidates().get(0);
                if (candidate.getContent() != null && candidate.getContent().getParts() != null && !candidate.getContent().getParts().isEmpty()) {
                    return candidate.getContent().getParts().get(0).getText();
                }
            }
            throw new IllegalStateException("Invalid response structure from Gemini API");
        } catch (HttpClientErrorException e) {
            // Check for 429 by status code — more robust than catching the subtype,
            // which can fail to match in some Spring Framework 7 exception chains.
            if (e.getStatusCode().value() == 429) {
                log.warn("Gemini API quota exceeded for model {}: {}", model, e.getMessage());
                throw new RateLimitExceededException(
                        "Gemini API quota exceeded. Please wait a moment and try again, or check your API key's quota at https://ai.dev/rate-limit.");
            }
            log.error("Gemini API HTTP error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new IllegalStateException("Gemini API returned " + e.getStatusCode() + ": " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to call Gemini API", e);
            throw new RuntimeException("Gemini API call failed: " + e.getMessage(), e);
        }
    }
}
