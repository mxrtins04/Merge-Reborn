package com.merge.merge.curriculum.service;

import com.merge.merge.curriculum.models.Stage;

import java.util.UUID;

public interface StageService {
    Stage create(String name, int xpThreshold);
    Stage getById(UUID stageId);
    void delete(UUID stageId);
    long getBuildPassRequired(UUID stageId);
}
