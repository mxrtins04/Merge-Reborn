package com.merge.merge.build.service.impl;

import com.merge.merge.ai.service.InstructorService;
import com.merge.merge.build.event.BuildCompletedEvent;
import com.merge.merge.build.models.BuildStatus;
import com.merge.merge.build.models.ConceptBuild;
import com.merge.merge.build.models.LevelBuild;
import com.merge.merge.build.models.ComprehensionCheck;
import com.merge.merge.build.repository.ConceptBuildRepository;
import com.merge.merge.build.repository.LevelBuildRepository;
import com.merge.merge.build.service.ConceptBuildService;
import com.merge.merge.build.service.LevelBuildService;
import com.merge.merge.build.service.ProgressionService;
import com.merge.merge.curriculum.models.Stage;
import com.merge.merge.curriculum.service.StageService;
import com.merge.merge.integration.judge0.Judge0Client;
import com.merge.merge.integration.judge0.Judge0Result;
import com.merge.merge.shared.queue.RedisTaskQueue;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@Slf4j
public class BuildQueueWorker {

    private final RedisTaskQueue redisTaskQueue;
    private final ConceptBuildRepository conceptBuildRepository;
    private final LevelBuildRepository levelBuildRepository;
    private final ConceptBuildService conceptBuildService;
    private final LevelBuildService levelBuildService;
    private final ProgressionService progressionService;
    private final StageService stageService;
    private final InstructorService instructorService;
    private final ApplicationEventPublisher eventPublisher;
    private final TaskExecutor taskExecutor;
    private final Judge0Client judge0Client;
    private final com.merge.merge.build.repository.ComprehensionCheckRepository comprehensionCheckRepository;

    private static final String QUEUE_NAME = "build:job:queue";
    private static final int CONCEPT_BUILD_XP = 20;
    private static final int LEVEL_BUILD_XP = 100;

    public BuildQueueWorker(
            RedisTaskQueue redisTaskQueue,
            ConceptBuildRepository conceptBuildRepository,
            LevelBuildRepository levelBuildRepository,
            ConceptBuildService conceptBuildService,
            LevelBuildService levelBuildService,
            ProgressionService progressionService,
            StageService stageService,
            InstructorService instructorService,
            ApplicationEventPublisher eventPublisher,
            @Qualifier("applicationTaskExecutor") TaskExecutor taskExecutor,
            Judge0Client judge0Client,
            com.merge.merge.build.repository.ComprehensionCheckRepository comprehensionCheckRepository
    ) {
        this.redisTaskQueue = redisTaskQueue;
        this.conceptBuildRepository = conceptBuildRepository;
        this.levelBuildRepository = levelBuildRepository;
        this.conceptBuildService = conceptBuildService;
        this.levelBuildService = levelBuildService;
        this.progressionService = progressionService;
        this.stageService = stageService;
        this.instructorService = instructorService;
        this.eventPublisher = eventPublisher;
        this.taskExecutor = taskExecutor;
        this.judge0Client = judge0Client;
        this.comprehensionCheckRepository = comprehensionCheckRepository;
    }

    @Scheduled(fixedDelay = 1000)
    public void pollQueue() {
        String taskId;
        while ((taskId = redisTaskQueue.dequeue(QUEUE_NAME)) != null) {
            final UUID id = UUID.fromString(taskId);
            log.info("BuildQueueWorker picked up build task ID {}. Dispatching...", id);

            taskExecutor.execute(() -> {
                try {
                    processBuild(id);
                } catch (Exception e) {
                    log.error("Unhandled exception in background processing of build task ID " + id, e);
                }
            });
        }
    }

    public void processBuild(UUID taskId) {
        // 1. Check if ConceptBuild
        ConceptBuild cb = conceptBuildRepository.findById(taskId).orElse(null);
        if (cb != null) {
            processConceptBuild(cb);
            return;
        }

        // 2. Check if LevelBuild
        LevelBuild lb = levelBuildRepository.findById(taskId).orElse(null);
        if (lb != null) {
            processLevelBuild(lb);
            return;
        }

        log.warn("Task ID {} not found in either ConceptBuild or LevelBuild collection.", taskId);
    }

    private void processConceptBuild(ConceptBuild cb) {
        if (cb.getStatus() != BuildStatus.QUEUED) {
            log.info("ConceptBuild {} is not in QUEUED state (current: {}). Skipping.", cb.getId(), cb.getStatus());
            return;
        }

        cb.setStatus(BuildStatus.RUNNING);
        conceptBuildRepository.save(cb);

        log.info("Running Judge0 execution for ConceptBuild {}", cb.getId());
        Judge0Result result = judge0Client.evaluate(cb.getSourceCode(), cb.getTestSuite());

        if (result.passed()) {
            cb.setHiddenTestsPassed(true);
            cb.setTddSuitePassed(true);
            cb.setComprehensionCheckPassed(false);

            com.merge.merge.ai.model.Instructor instructor = instructorService.generateBuildComprehensionSync(
                    cb.getStudentId(), cb.getConceptId(), cb.getSourceCode()
            );

            String questionsAndAnswers = instructor.getResult();
            String questions = parseQuestionsPart(questionsAndAnswers);
            String expectedAnswers = parseExpectedAnswersPart(questionsAndAnswers);

            ComprehensionCheck check = ComprehensionCheck.builder()
                    .id(UUID.randomUUID())
                    .studentId(cb.getStudentId())
                    .buildId(cb.getId())
                    .isLevelBuild(false)
                    .questions(questions)
                    .expectedAnswers(expectedAnswers)
                    .passed(false)
                    .serverDeadline(Instant.now().plusSeconds(10))
                    .createdAt(Instant.now())
                    .build();
            comprehensionCheckRepository.save(check);

            cb.setFeedback("Tests passed! Please complete your comprehension check to pass the build. Comprehension Check ID: " + check.getId());
            cb.setStatus(BuildStatus.RUNNING);
        } else {
            cb.setHiddenTestsPassed(false);
            cb.setTddSuitePassed(false);
            cb.setComprehensionCheckPassed(false);
            cb.setPassed(false);
            cb.setStatus(BuildStatus.FAILED);
            cb.setFeedback("Execution failed. Stdout: " + result.stdout() + ", Stderr: " + result.stderr() + ", Compile: " + result.compileOutput());
        }

        conceptBuildRepository.save(cb);
        log.info("Completed processing for ConceptBuild {}", cb.getId());
    }

    private void processLevelBuild(LevelBuild lb) {
        if (lb.getStatus() != BuildStatus.QUEUED) {
            log.info("LevelBuild {} is not in QUEUED state (current: {}). Skipping.", lb.getId(), lb.getStatus());
            return;
        }

        lb.setStatus(BuildStatus.RUNNING);
        levelBuildRepository.save(lb);

        log.info("Running Judge0 execution for LevelBuild {}", lb.getId());
        Judge0Result result = judge0Client.evaluate(lb.getSourceCode(), lb.getTestSuite());

        if (result.passed()) {
            lb.setHiddenTestsPassed(true);
            lb.setTddSuitePassed(true);
            lb.setComprehensionCheckPassed(false);
            levelBuildRepository.save(lb);

            instructorService.generateCleanCodeReviewAsync(
                    lb.getStudentId(), lb.getStageId(), lb.getGithubLink(), lb.getIdempotencyKey() + "-cc"
            );
            instructorService.evaluateSfiaAlignmentAsync(
                    lb.getStudentId(), lb.getStageId(), lb.getIdempotencyKey() + "-sfia"
            );

            com.merge.merge.ai.model.Instructor instructor = instructorService.generateBuildComprehensionSync(
                    lb.getStudentId(), lb.getStageId(), lb.getSourceCode()
            );

            String questionsAndAnswers = instructor.getResult();
            String questions = parseQuestionsPart(questionsAndAnswers);
            String expectedAnswers = parseExpectedAnswersPart(questionsAndAnswers);

            ComprehensionCheck check = ComprehensionCheck.builder()
                    .id(UUID.randomUUID())
                    .studentId(lb.getStudentId())
                    .buildId(lb.getId())
                    .isLevelBuild(true)
                    .questions(questions)
                    .expectedAnswers(expectedAnswers)
                    .passed(false)
                    .serverDeadline(Instant.now().plusSeconds(10))
                    .createdAt(Instant.now())
                    .build();
            comprehensionCheckRepository.save(check);

            LevelBuild latest = levelBuildRepository.findById(lb.getId()).orElse(lb);
            latest.setFeedback("Tests passed! Please complete your comprehension check to pass the build. Comprehension Check ID: " + check.getId());
            latest.setStatus(BuildStatus.RUNNING);
            levelBuildRepository.save(latest);
        } else {
            lb.setHiddenTestsPassed(false);
            lb.setTddSuitePassed(false);
            lb.setComprehensionCheckPassed(false);
            lb.setPassed(false);
            lb.setStatus(BuildStatus.FAILED);
            lb.setFeedback("Capstone build failed on unit tests. Stdout: " + result.stdout() + ", Stderr: " + result.stderr());
            levelBuildRepository.save(lb);
        }

        log.info("Completed processing for LevelBuild {} with status {}", lb.getId(), lb.getStatus());
    }

    private String parseQuestionsPart(String text) {
        if (text == null) return "";
        int qStart = text.indexOf("QUESTIONS:");
        int aStart = text.indexOf("EXPECTED_ANSWERS:");
        if (qStart != -1 && aStart != -1 && qStart < aStart) {
            return text.substring(qStart + "QUESTIONS:".length(), aStart).trim();
        }
        return text;
    }

    private String parseExpectedAnswersPart(String text) {
        if (text == null) return "";
        int aStart = text.indexOf("EXPECTED_ANSWERS:");
        if (aStart != -1) {
            return text.substring(aStart + "EXPECTED_ANSWERS:".length()).trim();
        }
        return "";
    }
}
