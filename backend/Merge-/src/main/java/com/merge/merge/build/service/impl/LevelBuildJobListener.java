package com.merge.merge.build.service.impl;

import com.merge.merge.ai.event.InstructorJobCompletedEvent;
import com.merge.merge.ai.model.Instructor;
import com.merge.merge.ai.model.InstructorActionType;
import com.merge.merge.ai.model.InstructorStatus;
import com.merge.merge.build.event.BuildCompletedEvent;
import com.merge.merge.build.models.BuildStatus;
import com.merge.merge.build.models.LevelBuild;
import com.merge.merge.build.repository.LevelBuildRepository;
import com.merge.merge.build.service.LevelBuildService;
import com.merge.merge.build.service.ProgressionService;
import com.merge.merge.curriculum.models.Stage;
import com.merge.merge.curriculum.service.StageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@Component
@RequiredArgsConstructor
@Slf4j
public class LevelBuildJobListener {

    private final LevelBuildRepository levelBuildRepository;
    private final LevelBuildService levelBuildService;
    private final ProgressionService progressionService;
    private final StageService stageService;
    private final ApplicationEventPublisher eventPublisher;
    private final MongoTemplate mongoTemplate;

    @EventListener
    public void onInstructorJobCompleted(InstructorJobCompletedEvent event) {
        Instructor job = event.getJob();
        String key = job.getIdempotencyKey();
        if (key == null) return;

        if (job.getActionType() == InstructorActionType.CLEAN_CODE_REVIEW && job.getStatus() == InstructorStatus.COMPLETED) {
            String buildKey = key.endsWith("-cc") ? key.substring(0, key.length() - 3) : key;
            levelBuildRepository.findByIdempotencyKey(buildKey).ifPresent(lb -> {
                int score = parseCleanCodeScore(job.getResult());
                if (score <= 0) {
                    Query query = Query.query(Criteria.where("id").is(lb.getId()));
                    Update update = new Update()
                            .set("status", BuildStatus.FAILED_NEEDS_REVIEW)
                            .set("feedback", "Clean code review scoring failed. LLM output did not match expected rubric format. Output:\n" + job.getResult());
                    mongoTemplate.updateFirst(query, update, LevelBuild.class);
                    log.error("Clean code review scoring failed for LevelBuild {}. LLM output: {}", lb.getId(), job.getResult());
                    return;
                }
                Query query = Query.query(Criteria.where("id").is(lb.getId()));
                Update update = new Update()
                        .set("cleanCodeScore", score)
                        .set("feedback", (lb.getFeedback() != null ? lb.getFeedback() : "") + "\nClean Code Feedback:\n" + job.getResult());
                mongoTemplate.updateFirst(query, update, LevelBuild.class);
                log.info("Updated LevelBuild {} with clean code score {}", lb.getId(), score);
                
                levelBuildRepository.findById(lb.getId()).ifPresent(this::checkAndEvaluateLevelBuild);
            });
        } else if (job.getActionType() == InstructorActionType.SFIA_ALIGNMENT_EVALUATE && job.getStatus() == InstructorStatus.COMPLETED) {
            String buildKey = key.endsWith("-sfia") ? key.substring(0, key.length() - 5) : key;
            levelBuildRepository.findByIdempotencyKey(buildKey).ifPresent(lb -> {
                Query query = Query.query(Criteria.where("id").is(lb.getId()));
                Update update = new Update()
                        .set("sfiaAligned", true)
                        .set("feedback", (lb.getFeedback() != null ? lb.getFeedback() : "") + "\nSFIA Alignment Feedback:\n" + job.getResult());
                mongoTemplate.updateFirst(query, update, LevelBuild.class);
                log.info("Updated LevelBuild {} with SFIA alignment status", lb.getId());

                levelBuildRepository.findById(lb.getId()).ifPresent(this::checkAndEvaluateLevelBuild);
            });
        }
    }

    private int parseCleanCodeScore(String result) {
        if (result == null) return 0;
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("SCORE:\\s*(\\d+)");
        java.util.regex.Matcher matcher = pattern.matcher(result);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return 0;
    }

    private void checkAndEvaluateLevelBuild(LevelBuild lb) {
        if (lb.getStatus() != BuildStatus.RUNNING) {
            return;
        }

        Stage stage = stageService.getById(lb.getStageId());
        boolean isCadet = stage.getName().toLowerCase().contains("cadet");

        boolean passed;
        if (isCadet) {
            if (!lb.isComprehensionCheckPassed()) {
                return;
            }
            passed = lb.isHiddenTestsPassed() && lb.isTddSuitePassed();
        } else {
            if (lb.getCleanCodeScore() == 0 || !lb.isSfiaAligned() || !lb.isComprehensionCheckPassed()) {
                return;
            }
            passed = lb.isHiddenTestsPassed() && lb.isTddSuitePassed() && (lb.getCleanCodeScore() >= 70);
        }

        lb.setPassed(passed);
        lb.setStatus(passed ? BuildStatus.PASSED : BuildStatus.FAILED);
        lb.setFeedback(passed ? "Capstone build completed and passed all gate checks."
                : "Capstone build failed one or more gating criteria. Clean Code Score: " + lb.getCleanCodeScore() + ", SFIA Aligned: " + lb.isSfiaAligned());
        levelBuildRepository.save(lb);

        if (passed) {
            levelBuildService.awardLevelXpOnce(lb.getId(), 100);
            progressionService.promoteIfEligible(lb.getStudentId(), lb.getStageId());

            List<Stage> allStages = stageService.listAll().stream()
                    .sorted(Comparator.comparingInt(Stage::getXpThreshold))
                    .collect(Collectors.toList());
            boolean isGraduation = allStages.isEmpty() || allStages.get(allStages.size() - 1).getId().equals(lb.getStageId());

            eventPublisher.publishEvent(new BuildCompletedEvent(
                    this, lb.getStudentId(), lb.getStageId(), true, isGraduation, lb.getIdempotencyKey()
            ));
        }
        log.info("Evaluated LevelBuild {} in job listener. Status: {}", lb.getId(), lb.getStatus());
    }
}
