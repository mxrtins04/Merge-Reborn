package com.merge.merge.project.repository;

import com.merge.merge.project.model.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends MongoRepository<Project, UUID> {
    List<Project> findByStudentId(UUID studentId);
}
