package com.merge.merge.build.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "comprehension_checks")
public class ComprehensionCheck {
    @Id
    private UUID id;
    private UUID studentId;
    private UUID buildId;
    private boolean isLevelBuild;
    private String questions;
    private String expectedAnswers;
    private boolean passed;
    private Instant serverDeadline;
    private Instant answeredAt;
    private String studentAnswers;
    private Instant createdAt;
}
