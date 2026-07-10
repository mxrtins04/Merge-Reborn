package com.merge.merge.curriculum.models;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Document(collection = "concepts")
public class Concept {

    @Id
    private UUID id;

    @NotNull
    @Indexed
    private UUID stageId;

    private PredefinedContentRef predefinedContentRef;

    private int order;

    public Concept(UUID stageId, PredefinedContentRef predefinedContentRef) {
        this.id = UUID.randomUUID();
        this.stageId = stageId;
        this.predefinedContentRef = predefinedContentRef;
    }

    public Concept(UUID stageId, PredefinedContentRef predefinedContentRef, int order) {
        this.id = UUID.randomUUID();
        this.stageId = stageId;
        this.predefinedContentRef = predefinedContentRef;
        this.order = order;
    }
}
