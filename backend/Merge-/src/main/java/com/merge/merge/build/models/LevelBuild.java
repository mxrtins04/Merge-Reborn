package com.merge.merge.build.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "level_builds")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LevelBuild {

    @Id
    private UUID id;

    @Indexed
    private UUID studentId;

    @Indexed
    private UUID stageId;

    private boolean passed;
    private int xpAwarded;
    private int cleanCodeScore;
    private boolean sfiaAligned;
    private String feedback;
    private BuildStatus status;
    private String githubLink;

    @Indexed(unique = true, sparse = true)
    private String idempotencyKey;

    private String sourceCode;
    private String testSuite;

    private boolean hiddenTestsPassed;
    private boolean tddSuitePassed;
    private boolean comprehensionCheckPassed;

    private Instant createdAt;
    private Instant updatedAt;
}
