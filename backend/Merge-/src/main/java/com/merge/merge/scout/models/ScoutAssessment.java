package com.merge.merge.scout.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "scout_assessments")
public class ScoutAssessment {
    @Id
    private UUID id;
    private UUID studentId;
    private Map<String, String> backgroundAnswers;
    private Map<String, String> conceptualAnswers;
    private String baselineCode;
    private boolean completed;
}
