package com.merge.merge.ai.service;

import com.merge.merge.ai.model.Instructor;
import com.merge.merge.ai.model.InstructorActionType;
import com.merge.merge.ai.model.InstructorStatus;
import com.merge.merge.ai.repository.InstructorRepository;
import com.merge.merge.ai.event.InstructorJobCompletedEvent;
import com.merge.merge.build.service.ConceptBuildService;
import com.merge.merge.curriculum.models.Concept;
import com.merge.merge.curriculum.models.PredefinedContentRef;
import com.merge.merge.curriculum.service.ConceptService;
import com.merge.merge.integration.gemini.GeminiClient;
import com.merge.merge.identity.service.CredentialService;
import com.merge.merge.identity.MissingCredentialException;
import com.merge.merge.shared.ResourceNotFoundException;
import com.merge.merge.shared.queue.RedisTaskQueue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstructorServiceImpl implements InstructorService {

    private final InstructorRepository instructorRepository;
    private final GeminiClient geminiClient;
    private final RedisTaskQueue redisTaskQueue;
    private final ConceptBuildService conceptBuildService;
    private final ApplicationEventPublisher eventPublisher;
    private final CredentialService credentialService;
    private final ConceptService conceptService;
    private final com.merge.merge.curriculum.repository.ConceptRepository conceptRepository;

    private static final String QUEUE_NAME = "instructor:job:queue";

    // -------------------------------------------------------------------------
    // Direct-call APIs (Sync and Async)
    // -------------------------------------------------------------------------

    @Override
    public Instructor chatInteraction(UUID studentId, UUID sessionId, String message) {
        log.info("Processing CHAT_INTERACTION synchronously for student: {}, session: {}", studentId, sessionId);

        String apiKey = getGeminiToken(studentId);
        String prompt = String.format("Respond to the student's message in a chat context. Student: %s, Message: %s", studentId, message);
        String result = geminiClient.generate(prompt, apiKey);

        Instructor instructor = Instructor.builder()
                .id(UUID.randomUUID())
                .actionType(InstructorActionType.CHAT_INTERACTION)
                .status(InstructorStatus.COMPLETED)
                .studentId(studentId)
                .sessionId(sessionId)
                .result(result)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return instructorRepository.save(instructor);
    }

    @Override
    public Instructor handleSessionExhausted(UUID studentId, UUID sessionId, UUID conceptId) {
        log.info("Session exhausted for student: {}, concept: {}. Deciding between prime and reinforce.", studentId, conceptId);

        // Check if concept build is passed
        boolean passed = conceptBuildService.isConceptBuildPassed(studentId, conceptId);

        if (passed) {
            log.info("Concept build passed. Dispatching AUDIO_PRIME.");
            return audioPrime(studentId, sessionId, conceptId);
        } else {
            log.info("Concept build not yet passed. Dispatching AUDIO_REINFORCE.");
            return audioReinforce(studentId, sessionId, conceptId);
        }
    }

    @Override
    public Instructor audioReinforce(UUID studentId, UUID sessionId, UUID conceptId) {
        // Guarded: check for existing successful generation
        List<Instructor> existing = instructorRepository.findByActionTypeAndStudentIdAndConceptIdAndStatus(
                InstructorActionType.AUDIO_REINFORCE, studentId, conceptId, InstructorStatus.COMPLETED
        );
        if (!existing.isEmpty()) {
            log.info("AUDIO_REINFORCE already completed for student: {} and concept: {}. Returning cached result.", studentId, conceptId);
            return existing.get(0);
        }

        return enqueueJob(InstructorActionType.AUDIO_REINFORCE, studentId, conceptId, sessionId, null, null);
    }

    @Override
    public Instructor audioPrime(UUID studentId, UUID sessionId, UUID conceptId) {
        // Guarded: check for existing successful generation
        List<Instructor> existing = instructorRepository.findByActionTypeAndStudentIdAndConceptIdAndStatus(
                InstructorActionType.AUDIO_PRIME, studentId, conceptId, InstructorStatus.COMPLETED
        );
        if (!existing.isEmpty()) {
            log.info("AUDIO_PRIME already completed for student: {} and concept: {}. Returning cached result.", studentId, conceptId);
            return existing.get(0);
        }

        return enqueueJob(InstructorActionType.AUDIO_PRIME, studentId, conceptId, sessionId, null, null);
    }

    @Override
    public boolean evaluateDrillAnswer(UUID studentId, UUID conceptId, String question, String expectedAnswer, String studentAnswer) {
        log.info("Evaluating drill answer for student: {}, concept: {}", studentId, conceptId);

        String prompt = String.format(
                """
                You are an expert software engineering tutor grading a student's answer to a drill question.

                Question: %s
                Model answer: %s
                Student's answer: %s

                Does the student's answer demonstrate a sufficient understanding of the concept?
                Minor wording differences are fine. Evaluate based on conceptual correctness, not exact wording.

                Respond with EXACTLY one word: PASS or FAIL
                """,
                question, expectedAnswer, studentAnswer
        );

        String apiKey = getGeminiToken(studentId);
        String result = geminiClient.generate(prompt, apiKey).trim().toUpperCase();
        log.info("Drill evaluation result for student {}: {}", studentId, result);
        return result.contains("PASS");
    }

    @Override
    public Instructor missionGenerate(UUID studentId, UUID conceptId, Map<String, Object> context) {
        // Not guarded: duplicate generation is harmless
        return enqueueJob(InstructorActionType.MISSION_GENERATE, studentId, conceptId, null, context, null);
    }

    // -------------------------------------------------------------------------
    // Event-reaction APIs (Sync and Async)
    // -------------------------------------------------------------------------

    @Override
    public Instructor generateDrillSync(UUID studentId, UUID conceptId) {
        log.info("Generating DRILL_GENERATE synchronously for student: {}, concept: {}", studentId, conceptId);

        Concept concept = conceptService.getById(conceptId);
        PredefinedContentRef content = concept.getPredefinedContentRef();

        String prompt = String.format(
                """
                You are an expert software engineering tutor generating a short-answer drill question.

                Concept topic: %s
                Core content: %s
                Real-world failure scenario: %s

                Generate ONE short-answer drill question that tests whether the student understands this concept.
                The question should be concise and answerable in 1-3 sentences.

                You MUST respond using EXACTLY this format and nothing else:
                QUESTION: <the question text here>
                ANSWER: <the correct answer here>
                """,
                content.getTeachingObjective(),
                content.getCoreContent(),
                content.getFailureScenario()
        );

        String apiKey = getGeminiToken(studentId);
        String result = geminiClient.generate(prompt, apiKey);

        Instructor instructor = Instructor.builder()
                .id(UUID.randomUUID())
                .actionType(InstructorActionType.DRILL_GENERATE)
                .status(InstructorStatus.COMPLETED)
                .studentId(studentId)
                .conceptId(conceptId)
                .result(result)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return instructorRepository.save(instructor);
    }

    @Override
    public Instructor generateComprehensionSync(UUID studentId, UUID conceptId, UUID drillId) {
        log.info("Generating COMPREHENSION_GENERATE synchronously for student: {}, concept: {}, drill: {}", studentId, conceptId, drillId);

        Concept concept = conceptService.getById(conceptId);
        PredefinedContentRef content = concept.getPredefinedContentRef();

        String prompt = String.format(
                """
                You are an expert software engineering tutor providing feedback to a student who just passed a drill.

                Concept topic: %s
                Core content: %s

                The student answered a drill question on this concept correctly. Write 2-3 sentences of encouraging,
                insightful feedback that reinforces what they got right and connects it to real-world engineering practice.
                Be specific to the concept, not generic.
                """,
                content.getTeachingObjective(),
                content.getCoreContent()
        );

        String apiKey = getGeminiToken(studentId);
        String result = geminiClient.generate(prompt, apiKey);

        Instructor instructor = Instructor.builder()
                .id(UUID.randomUUID())
                .actionType(InstructorActionType.COMPREHENSION_GENERATE)
                .status(InstructorStatus.COMPLETED)
                .studentId(studentId)
                .conceptId(conceptId)
                .result(result)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return instructorRepository.save(instructor);
    }

    @Override
    public Instructor generateBuildPrdAsync(UUID studentId, UUID conceptId, String idempotencyKey) {
        // Rides on existing build idempotencyKey
        if (idempotencyKey != null) {
            var existing = instructorRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("PRD Generation already exists for idempotencyKey: {}. Returning it.", idempotencyKey);
                return existing.get();
            }
        }

        return enqueueJob(InstructorActionType.BUILD_PRD_GENERATE, studentId, conceptId, null, null, idempotencyKey);
    }

    @Override
    public Instructor generateCleanCodeReviewAsync(UUID studentId, UUID conceptId, String code, String idempotencyKey) {
        // Rides on existing build idempotencyKey
        if (idempotencyKey != null) {
            var existing = instructorRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Clean Code Review already exists for idempotencyKey: {}. Returning it.", idempotencyKey);
                return existing.get();
            }
        }

        Map<String, Object> context = new HashMap<>();
        context.put("code", code);

        return enqueueJob(InstructorActionType.CLEAN_CODE_REVIEW, studentId, conceptId, null, context, idempotencyKey);
    }

    @Override
    public Instructor generateReflectionAsync(UUID studentId, UUID conceptId, boolean passed, boolean isGraduation, String idempotencyKey) {
        if (idempotencyKey != null) {
            var existingJob = instructorRepository.findByIdempotencyKey(idempotencyKey);
            if (existingJob.isPresent()) {
                log.info("REFLECT job already exists for idempotencyKey: {}. Returning existing.", idempotencyKey);
                return existingJob.get();
            }
        }

        // Guarded: check for existing successful generation
        List<Instructor> existing = instructorRepository.findByActionTypeAndStudentIdAndConceptIdAndStatus(
                InstructorActionType.REFLECT, studentId, conceptId, InstructorStatus.COMPLETED
        );
        if (!existing.isEmpty()) {
            log.info("REFLECT already completed for student: {} and concept: {}. Returning cached result.", studentId, conceptId);
            return existing.get(0);
        }

        Map<String, Object> context = new HashMap<>();
        context.put("passed", passed);
        context.put("isGraduation", isGraduation);

        return enqueueJob(InstructorActionType.REFLECT, studentId, conceptId, null, context, idempotencyKey);
    }

    @Override
    public Instructor evaluateSfiaAlignmentAsync(UUID studentId, UUID conceptId, String idempotencyKey) {
        if (idempotencyKey != null) {
            var existing = instructorRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("SFIA alignment check already exists for idempotencyKey: {}. Returning it.", idempotencyKey);
                return existing.get();
            }
        }
        return enqueueJob(InstructorActionType.SFIA_ALIGNMENT_EVALUATE, studentId, conceptId, null, null, idempotencyKey);
    }

    // -------------------------------------------------------------------------
    // Job processing for background worker
    // -------------------------------------------------------------------------

    @Override
    public void processJob(UUID jobId) {
        log.info("Picking up job {} for processing", jobId);

        Instructor job = instructorRepository.findById(jobId).orElse(null);
        if (job == null) {
            log.error("Job {} not found in database", jobId);
            return;
        }

        if (job.getStatus() != InstructorStatus.QUEUED) {
            log.warn("Job {} is not in QUEUED state (current: {}). Skipping.", jobId, job.getStatus());
            return;
        }

        job.setStatus(InstructorStatus.RUNNING);
        job.setUpdatedAt(Instant.now());
        instructorRepository.save(job);

        try {
            String apiKey = getGeminiToken(job.getStudentId());
            String prompt = buildPrompt(job);
            String result = geminiClient.generate(prompt, apiKey);

            job.setResult(result);
            job.setStatus(InstructorStatus.COMPLETED);
        } catch (Exception e) {
            log.error("Failed to execute AI generation for job " + jobId, e);
            job.setErrorMessage(e.getMessage());
            job.setStatus(InstructorStatus.FAILED);
        }

        job.setUpdatedAt(Instant.now());
        Instructor saved = instructorRepository.save(job);
        log.info("Completed job {} processing with status: {}", jobId, job.getStatus());
        eventPublisher.publishEvent(new InstructorJobCompletedEvent(this, saved));
    }

    @Override
    public Instructor getInstructorRecord(UUID id) {
        return instructorRepository.findById(id).orElse(null);
    }

    // -------------------------------------------------------------------------
    // Helper methods
    // -------------------------------------------------------------------------

    private Instructor enqueueJob(
            InstructorActionType actionType,
            UUID studentId,
            UUID conceptId,
            UUID sessionId,
            Map<String, Object> context,
            String idempotencyKey
    ) {
        UUID jobId = UUID.randomUUID();
        Instructor job = Instructor.builder()
                .id(jobId)
                .actionType(actionType)
                .status(InstructorStatus.QUEUED)
                .studentId(studentId)
                .conceptId(conceptId)
                .sessionId(sessionId)
                .context(context)
                .idempotencyKey(idempotencyKey)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Instructor saved = instructorRepository.save(job);
        redisTaskQueue.enqueue(QUEUE_NAME, jobId.toString());
        log.info("Enqueued job {} with actionType: {}", jobId, actionType);
        return saved;
    }

    private String buildPrompt(Instructor job) {
        Concept concept = null;
        if (job.getConceptId() != null) {
            concept = conceptRepository.findById(job.getConceptId()).orElse(null);
            if (concept == null) {
                List<Concept> stageConcepts = conceptRepository.findByStageId(job.getConceptId());
                if (!stageConcepts.isEmpty()) {
                    concept = stageConcepts.get(0);
                }
            }
        }
        PredefinedContentRef content = concept != null ? concept.getPredefinedContentRef() : null;
        String topic     = content != null ? content.getTeachingObjective() : "unknown concept";
        String core      = content != null ? content.getCoreContent()       : "";
        String failure   = content != null ? content.getFailureScenario()   : "";

        return switch (job.getActionType()) {
            case BUILD_PRD_GENERATE -> String.format(
                    """
                    You are an expert software engineering tutor creating a project brief for a student.

                    Concept: %s
                    What the student must learn: %s
                    Common failure mode to guard against: %s

                    Generate a concise Product Requirement Document (PRD) for a coding project that directly exercises this concept.
                    Structure:
                    - PROJECT OVERVIEW: 2-3 sentences describing the project
                    - CORE REQUIREMENTS: 3-5 numbered functional requirements
                    - CONSTRAINTS: what the student must NOT use (e.g. no built-in sort, no framework X)
                    - ACCEPTANCE CRITERIA: how passing/failing will be judged

                    Keep it scoped for 1-3 days of solo student work. Be specific to the concept, not generic.
                    """,
                    topic, core, failure);

            case AUDIO_REINFORCE -> String.format(
                    """
                    You are an expert software engineering instructor recording an audio lesson.

                    A student is struggling with this concept:
                    Concept: %s
                    Core content: %s
                    Typical failure mode: %s

                    Write a 2-3 minute spoken script (plain prose, no markdown, no headers) that:
                    1. Re-explains the concept from a fresh angle — not a repetition of the original
                    2. Directly addresses the typical failure mode with a concrete counter-example
                    3. Closes with one actionable thing the student should try in their next attempt

                    Speak directly to the student in second person ("you"). Calm, precise, encouraging tone.
                    """,
                    topic, core, failure);

            case AUDIO_PRIME -> String.format(
                    """
                    You are an expert software engineering instructor recording a short motivational primer.

                    A student has just demonstrated mastery of this concept:
                    Concept: %s
                    Core content: %s

                    Write a 1-2 minute spoken script (plain prose, no markdown, no headers) that:
                    1. Briefly affirms what they proved they understand
                    2. Introduces the mental model they will need for the next concept
                    3. Ends with a single concrete question for them to sit with before the next session

                    Speak directly to the student in second person. Confident, forward-looking tone.
                    """,
                    topic, core);

            case MISSION_GENERATE -> {
                Map<String, Object> contextData = job.getContext();
                String flowType = contextData != null ? (String) contextData.get("flowType") : "FAILURE";
                if ("RESOLUTION".equals(flowType)) {
                    yield String.format(
                            """
                            You are an expert AI tutor tracking a student's learning missions.

                            Concept: %s
                            Learning goal: %s

                            A student has successfully passed an attempt on this concept.
                            Attempt context: %s

                            Compare this passing attempt with the existing open missions/pain points in the context.
                            Determine which open missions are resolved by this passing attempt.

                            Respond with ONLY a raw JSON object — no markdown, no explanation:
                            {
                              "resolvedMissionIds": ["uuid-string"]
                            }
                            """,
                            topic, core, contextData != null ? contextData.toString() : "None");
                } else {
                    yield String.format(
                            """
                            You are an expert AI tutor tracking a student's learning missions.

                            Concept: %s
                            Learning goal: %s
                            Common failure mode: %s

                            A student has failed an attempt on this concept.
                            Attempt context: %s

                            Identify the specific conceptual gaps this failure reveals. Check if they match any existing open missions in the context, then generate targeted advice for each gap.

                            Respond with ONLY a raw JSON array — no markdown, no explanation:
                            [
                              {
                                "painPointDescription": "string",
                                "matchedMissionId": "string-or-null",
                                "conceptAndContext": "string"
                              }
                            ]
                            """,
                            topic, core, failure, contextData != null ? contextData.toString() : "None");
                }
            }

            case CLEAN_CODE_REVIEW -> {
                String code = job.getContext() != null ? (String) job.getContext().get("code") : "";
                yield String.format(
                        """
                        You are a senior software engineer performing a clean code review.

                        The student is working on a concept build for:
                        Concept: %s
                        Learning goal: %s

                        Submitted code:
                        %s

                        Review for:
                        - Naming: are variable, method, and class names intention-revealing?
                        - Single responsibility: does each unit do exactly one thing?
                        - Readability: can a reader understand the logic without comments?
                        - Duplication: is there any redundant logic that should be extracted?

                        Be specific — reference actual names and patterns from the code above.

                        Format your response EXACTLY as:
                        SCORE: <number>/100
                        FEEDBACK: <detailed feedback referencing the actual code>
                        """,
                        topic, core, code);
            }

            case REFLECT -> {
                Boolean passed = job.getContext() != null ? (Boolean) job.getContext().get("passed") : null;
                Boolean isGraduation = job.getContext() != null ? (Boolean) job.getContext().get("isGraduation") : null;
                yield String.format(
                        """
                        You are a thoughtful engineering mentor writing a reflection prompt.

                        A student has just completed a concept build on:
                        Concept: %s
                        Core content: %s

                        Outcome: %s. Stage graduation build: %s.

                        Write 3-4 open-ended reflection questions (not statements) that:
                        1. Ask the student to articulate what they now understand in their own words
                        2. Challenge them to connect this concept to a real system they use daily
                        3. Ask what they would design differently if they started again
                        %s

                        Questions only — no preamble, no answers. Each question on its own line, numbered.
                        """,
                        topic, core,
                        Boolean.TRUE.equals(passed) ? "PASSED" : "FAILED",
                        Boolean.TRUE.equals(isGraduation) ? "YES" : "NO",
                        Boolean.TRUE.equals(isGraduation)
                                ? "4. Ask how mastering this concept changed how they think about the full stage they just completed"
                                : "");
            }

            case SFIA_ALIGNMENT_EVALUATE -> String.format(
                    """
                    You are an engineering competency evaluator using the SFIA (Skills Framework for the Information Age).

                    A student has demonstrated mastery of:
                    Concept: %s
                    Core content: %s
                    They avoided this failure mode: %s

                    Identify the top 2-3 SFIA skills this concept directly develops. For each, state the SFIA level (1-7) a student achieving basic mastery of this concept would typically operate at.

                    Format EXACTLY as (one skill per line, no extra text):
                    SFIA_SKILL: <skill name> | LEVEL: <1-7> | JUSTIFICATION: <one sentence tied to the concept above>
                    """,
                    topic, core, failure);

            default -> throw new IllegalArgumentException("Unsupported async action type: " + job.getActionType());
        };
    }

    private String getGeminiToken(UUID studentId) {
        try {
            String token = credentialService.getDecryptedToken(studentId, CredentialService.TokenType.GEMINI);
            if (token == null || token.trim().isEmpty()) {
                throw new MissingCredentialException("Gemini API key is required and cannot be blank. Please submit a valid token.");
            }
            return token;
        } catch (ResourceNotFoundException e) {
            throw new MissingCredentialException("Gemini API key is required. Please submit your token first.");
        }
    }

    @Override
    public Instructor generateBuildComprehensionSync(UUID studentId, UUID conceptOrStageId, String code) {
        log.info("Generating COMPREHENSION_GENERATE for build code synchronously for student: {}, concept/stage: {}", studentId, conceptOrStageId);

        Concept concept = conceptRepository.findById(conceptOrStageId).orElse(null);
        if (concept == null) {
            List<Concept> stageConcepts = conceptRepository.findByStageId(conceptOrStageId);
            if (!stageConcepts.isEmpty()) {
                concept = stageConcepts.get(0);
            }
        }

        if (concept == null) {
            throw new com.merge.merge.shared.ResourceNotFoundException("No concept found for ID or Stage ID: " + conceptOrStageId);
        }

        PredefinedContentRef content = concept.getPredefinedContentRef();

        String prompt = String.format(
                """
                You are an expert software engineering tutor.
                The student has submitted the following code that passed unit tests for the concept: %%s (goal: %%s).

                Submitted code:
                %%s

                Generate 3 short-answer comprehension questions that test if the student truly understands their own code.
                The questions must reference specific variable names, functions, or design choices they made in their code.
                Do not make them generic.

                Format the output EXACTLY as:
                QUESTIONS:
                1. <question 1>
                2. <question 2>
                3. <question 3>
                EXPECTED_ANSWERS:
                1. <answer 1>
                2. <answer 2>
                3. <answer 3>
                """,
                content.getTeachingObjective(),
                content.getCoreContent(),
                code
        );

        String apiKey = getGeminiToken(studentId);
        String result = geminiClient.generate(prompt, apiKey);

        Instructor instructor = Instructor.builder()
                .id(UUID.randomUUID())
                .actionType(InstructorActionType.COMPREHENSION_GENERATE)
                .status(InstructorStatus.COMPLETED)
                .studentId(studentId)
                .conceptId(concept.getId())
                .result(result)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return instructorRepository.save(instructor);
    }

    @Override
    public boolean evaluateComprehensionCheck(UUID studentId, String questions, String expectedAnswers, String studentAnswers) {
        log.info("Evaluating comprehension check answers for student: {}", studentId);

        String prompt = String.format(
                """
                You are an expert software engineering tutor grading a student's answers to comprehension questions.

                Questions and model answers:
                %%s
                %%s

                Student's submitted answers:
                %%s

                Does the student's submission demonstrate sufficient understanding of the questions?
                All questions must be answered reasonably well.

                Respond with EXACTLY one word: PASS or FAIL
                """,
                questions, expectedAnswers, studentAnswers
        );

        String apiKey = getGeminiToken(studentId);
        String result = geminiClient.generate(prompt, apiKey).trim().toUpperCase();
        log.info("Comprehension check evaluation result: {}", result);
        return result.contains("PASS");
    }
}
