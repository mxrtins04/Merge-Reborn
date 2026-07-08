package com.merge.merge.curriculum.models;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Document(collection = "stages")
public class Stage {

    @Id
    private UUID id;

    @NotBlank
    private String name;

    @Min(1)
    private int xpThreshold;

    public Stage(String name, int xpThreshold) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.xpThreshold = xpThreshold;
    }
}
