package com.merge.merge.curriculum.models;

import jakarta.validation.constraints.NotBlank;
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
@Document(collection = "resources")
public class Resource {

    @Id
    private UUID id;

    @NotNull
    @Indexed
    private UUID conceptId;

    @NotBlank
    private String type;

    @NotBlank
    private String title;

    @NotBlank
    private String url;

    public Resource(UUID conceptId, String type, String title, String url) {
        this.id = UUID.randomUUID();
        this.conceptId = conceptId;
        this.type = type;
        this.title = title;
        this.url = url;
    }
}
