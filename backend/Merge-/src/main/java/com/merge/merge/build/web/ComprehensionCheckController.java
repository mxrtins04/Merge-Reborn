package com.merge.merge.build.web;

import com.merge.merge.build.models.ComprehensionCheck;
import com.merge.merge.build.repository.ComprehensionCheckRepository;
import com.merge.merge.build.service.ConceptBuildService;
import com.merge.merge.build.service.LevelBuildService;
import com.merge.merge.ai.service.InstructorService;
import com.merge.merge.build.models.ConceptBuild;
import com.merge.merge.build.models.LevelBuild;
import com.merge.merge.build.models.BuildStatus;
import com.merge.merge.build.service.ProgressionService;
import com.merge.merge.curriculum.models.Stage;
import com.merge.merge.curriculum.service.StageService;
import com.merge.merge.build.event.BuildCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/comprehension-checks")
@RequiredArgsConstructor
@Slf4j
public class ComprehensionCheckController {

    private final ComprehensionCheckRepository checkRepository;
    private final InstructorService instructorService;
    private final ConceptBuildService conceptBuildService;
    private final LevelBuildService levelBuildService;
    private final ProgressionService progressionService;
    private final StageService stageService;
    private final ApplicationEventPublisher eventPublisher;

    public record SubmitCheckRequest(String answers) {}
    public record SubmitCheckResponse(boolean passed, String feedback) {}

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitCheck(
            @PathVariable UUID id,
            @RequestBody SubmitCheckRequest request,
            Authentication authentication
    ) {
        UUID studentId = (UUID) authentication.getPrincipal();
        ComprehensionCheck check = checkRepository.findById(id).orElse(null);
        if (check == null) {
            return ResponseEntity.notFound().build();
        }

        if (!check.getStudentId().equals(studentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (check.isPassed()) {
            return ResponseEntity.ok(new SubmitCheckResponse(true, "Comprehension check already passed."));
        }

        Instant now = Instant.now();
        check.setAnsweredAt(now);
        check.setStudentAnswers(request.answers());

        // Server-side deadline check
        if (now.isAfter(check.getServerDeadline())) {
            checkRepository.save(check);
            ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
            problem.setTitle("Timer Expired");
            problem.setDetail("The comprehension check submission deadline has passed.");
            return ResponseEntity.badRequest().body(problem);
        }

        // Scoring logic
        boolean passed = instructorService.evaluateComprehensionCheck(
                studentId, check.getQuestions(), check.getExpectedAnswers(), request.answers()
        );

        check.setPassed(passed);
        checkRepository.save(check);

        if (passed) {
            if (!check.isLevelBuild()) {
                ConceptBuild cb = conceptBuildService.getConceptBuildRecord(check.getBuildId());
                if (cb != null) {
                    cb.setComprehensionCheckPassed(true);
                    cb.setPassed(cb.isHiddenTestsPassed() && cb.isTddSuitePassed());
                    cb.setStatus(cb.isPassed() ? BuildStatus.PASSED : BuildStatus.FAILED);
                    conceptBuildService.save(cb);
                    if (cb.isPassed()) {
                        conceptBuildService.awardXpOnce(cb.getId(), 20);
                    }
                }
            } else {
                LevelBuild lb = levelBuildService.getLevelBuildRecord(check.getBuildId());
                if (lb != null) {
                    lb.setComprehensionCheckPassed(true);
                    levelBuildService.save(lb);

                    Stage stage = stageService.getById(lb.getStageId());
                    boolean isCadet = stage.getName().toLowerCase().contains("cadet");
                    log.info("ComprehensionCheck check ID: {}, isLevelBuild: true, isCadet: {}, hiddenTestsPassed: {}, tddSuitePassed: {}",
                            check.getId(), isCadet, lb.isHiddenTestsPassed(), lb.isTddSuitePassed());
                    if (isCadet) {
                        boolean lbPassed = lb.isHiddenTestsPassed() && lb.isTddSuitePassed();
                        lb.setPassed(lbPassed);
                        lb.setStatus(lbPassed ? BuildStatus.PASSED : BuildStatus.FAILED);
                        levelBuildService.save(lb);
                        log.info("Saved LevelBuild {} with status {} and passed {}", lb.getId(), lb.getStatus(), lb.isPassed());
                        if (lbPassed) {
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
                    } else {
                        if (lb.getCleanCodeScore() > 0 && lb.isSfiaAligned()) {
                            boolean lbPassed = lb.isHiddenTestsPassed() && lb.isTddSuitePassed() && (lb.getCleanCodeScore() >= 70);
                            lb.setPassed(lbPassed);
                            lb.setStatus(lbPassed ? BuildStatus.PASSED : BuildStatus.FAILED);
                            levelBuildService.save(lb);
                            if (lbPassed) {
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
                        }
                    }
                }
            }
        }

        return ResponseEntity.ok(new SubmitCheckResponse(passed, passed ? "All gates passed successfully!" : "Evaluation failed. Please review your answers and retry."));
    }
}
