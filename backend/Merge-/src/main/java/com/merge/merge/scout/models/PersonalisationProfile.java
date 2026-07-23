package com.merge.merge.scout.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "personalisation_profiles")
public class PersonalisationProfile {
    @Id
    private UUID id;
    private UUID studentId;
    private String thinkingStyle;
    private String motivationType;
    private String priorExposure;
    private String learningApproach;
}
