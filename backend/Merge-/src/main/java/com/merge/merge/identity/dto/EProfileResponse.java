package com.merge.merge.identity.dto;

import com.merge.merge.identity.models.CompetencyData;
import com.merge.merge.identity.models.EProfile;
import com.merge.merge.identity.models.LevelOfThinking;
import com.merge.merge.identity.models.NoveltyOfThinking;
import com.merge.merge.identity.models.SfiaScores;

import java.util.UUID;

/**
 * Response DTO for EProfile data. Explicit field-by-field mapping from the
 * entity — same rule as StudentResponse: every field here is a conscious
 * inclusion, not an accidental inclusion.
 */
public record EProfileResponse(
        UUID id,
        UUID studentId,
        SfiaScoresResponse sfiaScores,
        Float projectCompletionRate,
        Float consistencyScore,
        LevelOfThinking levelOfThinking,
        NoveltyOfThinking noveltyOfThinking
) {
    public static EProfileResponse from(EProfile eProfile) {
        CompetencyData cd = eProfile.getCompetencyData();
        return new EProfileResponse(
                eProfile.getId(),
                eProfile.getStudentId(),
                SfiaScoresResponse.from(cd.getSfiaScores()),
                cd.getProjectCompletionRate(),
                cd.getConsistencyScore(),
                cd.getLevelOfThinking(),
                cd.getNoveltyOfThinking()
        );
    }

    /**
     * Nested DTO for SFIA scores. Exists separately so SfiaScores domain
     * object internals (validation logic, constructor) do not leak into the
     * response contract.
     */
    public record SfiaScoresResponse(
            Integer programming,
            Integer systemDesign,
            Integer testing,
            Integer security,
            Integer dataManagement,
            Integer analytics,
            Integer deployment,
            Integer problemSolving
    ) {
        public static SfiaScoresResponse from(SfiaScores scores) {
            if (scores == null) {
                return null;
            }
            return new SfiaScoresResponse(
                    scores.getProgramming(),
                    scores.getSystemDesign(),
                    scores.getTesting(),
                    scores.getSecurity(),
                    scores.getDataManagement(),
                    scores.getAnalytics(),
                    scores.getDeployment(),
                    scores.getProblemSolving()
            );
        }
    }
}
