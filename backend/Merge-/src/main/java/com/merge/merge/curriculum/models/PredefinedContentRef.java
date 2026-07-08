package com.merge.merge.curriculum.models;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class PredefinedContentRef {

    @NotBlank
    private String failureScenario;

    @NotBlank
    private String teachingObjective;

    @NotBlank
    private String coreContent;
}
