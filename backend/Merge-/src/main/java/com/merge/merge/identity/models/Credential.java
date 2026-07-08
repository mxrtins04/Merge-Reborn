package com.merge.merge.identity.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Document(collection = "credentials")
public class Credential {

    @Id
    private UUID id;

    @Indexed(unique = true)
    @NotNull
    private UUID studentId;

    @NotBlank
    private String geminiTokenEncrypted;

    @NotBlank
    private String githubTokenEncrypted;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public Credential(UUID studentId) {
        this.id = UUID.randomUUID();
        this.studentId = studentId;
    }
}
