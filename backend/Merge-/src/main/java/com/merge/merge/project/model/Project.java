package com.merge.merge.project.model;

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
@Document(collection = "projects")
public class Project {

    @Id
    private UUID id;

    private UUID studentId;

    private String given;

    private String link;

    private String prd;

    private String review;

    @Builder.Default
    private ProjectStatus status = ProjectStatus.PENDING;

    private Instant createdAt;

    private Instant updatedAt;
}
