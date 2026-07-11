package com.merge.merge.project.service;

import com.merge.merge.project.model.Project;
import com.merge.merge.project.model.ProjectStatus;

import java.util.List;
import java.util.UUID;

public interface ProjectService {
    Project createProject(UUID studentId, String given, String link, String prd);
    Project getProject(UUID id);
    List<Project> getProjectsByStudentId(UUID studentId);
    Project updateProjectStatus(UUID id, ProjectStatus status, String review);
}
