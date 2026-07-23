package com.merge.merge.scout.service;

import com.merge.merge.scout.models.ScoutAssessment;
import com.merge.merge.scout.models.PersonalisationProfile;
import java.util.UUID;
import java.util.Map;

public interface ScoutService {
    ScoutAssessment startOrGetAssessment(UUID studentId);
    ScoutAssessment submitBackgroundAnswers(UUID studentId, Map<String, String> answers);
    ScoutAssessment submitConceptualAnswers(UUID studentId, Map<String, String> answers);
    ScoutAssessment submitBaselineCode(UUID studentId, String code);
    PersonalisationProfile completeScoutAssessment(UUID studentId);
}
