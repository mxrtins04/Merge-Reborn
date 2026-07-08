package com.merge.merge.curriculum.service;

import com.merge.merge.curriculum.models.Resource;

import java.util.UUID;

public interface ResourceService {
    Resource create(UUID conceptId, String type, String title, String url);
    void delete(UUID resourceId);
    long countByConceptId(UUID conceptId);
}
