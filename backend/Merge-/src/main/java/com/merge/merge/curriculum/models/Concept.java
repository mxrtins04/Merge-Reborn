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

    /** Human-readable concept title, e.g. "Computational Thinking". */
    private String name;

    private PredefinedContentRef predefinedContentRef;

    private int order;

    public Concept(UUID stageId, String name, PredefinedContentRef predefinedContentRef) {
        this.id = UUID.randomUUID();
        this.stageId = stageId;
        this.name = name;
        this.predefinedContentRef = predefinedContentRef;
    }

    public Concept(UUID stageId, String name, PredefinedContentRef predefinedContentRef, int order) {
        this.id = UUID.randomUUID();
        this.stageId = stageId;
        this.name = name;
        this.predefinedContentRef = predefinedContentRef;
        this.order = order;
    }

    public Concept(UUID stageId, PredefinedContentRef predefinedContentRef) {
        this.id = UUID.randomUUID();
        this.stageId = stageId;
        this.predefinedContentRef = predefinedContentRef;
        this.name = predefinedContentRef != null ? predefinedContentRef.getTeachingObjective() : null;
    }

    public Concept(UUID stageId, PredefinedContentRef predefinedContentRef, int order) {
        this.id = UUID.randomUUID();
        this.stageId = stageId;
        this.predefinedContentRef = predefinedContentRef;
        this.name = predefinedContentRef != null ? predefinedContentRef.getTeachingObjective() : null;
        this.order = order;
    }

    public String getName() {
        if (this.name == null || (this.predefinedContentRef != null && this.name.equals(this.predefinedContentRef.getTeachingObjective()))) {
            String canonical = getCanonicalName(this.stageId, this.order);
            if (canonical != null) {
                return canonical;
            }
        }
        return this.name;
    }

    private static String getCanonicalName(UUID stageId, int order) {
        if (stageId == null) return null;
        String idStr = stageId.toString();
        if (idStr.endsWith("-000000000001")) { // SCOUT
            return switch (order) {
                case 1 -> "Computational Thinking";
                case 2 -> "Clean Code Fundamentals";
                case 3 -> "Variables and Data Types";
                case 4 -> "Operators and Expressions";
                case 5 -> "Control Flow: Conditionals";
                case 6 -> "Control Flow: Loops";
                case 7 -> "Functions";
                case 8 -> "Arrays and Lists";
                case 9 -> "Strings";
                case 10 -> "Debugging Fundamentals";
                case 11 -> "Testing Fundamentals";
                case 12 -> "Git Fundamentals";
                case 13 -> "Big-O Notation";
                case 14 -> "Memory and Storage";
                case 15 -> "Core Data Structures";
                default -> null;
            };
        } else if (idStr.endsWith("-000000000002")) { // CADET
            return switch (order) {
                case 1 -> "Object-Oriented Programming";
                case 2 -> "Encapsulation and Abstraction";
                case 3 -> "Inheritance";
                case 4 -> "Polymorphism";
                case 5 -> "Interfaces and Contracts";
                case 6 -> "SOLID Principles";
                case 7 -> "Composition over Inheritance";
                case 8 -> "Java Collections Framework";
                case 9 -> "Exception Handling";
                case 10 -> "File I/O and Streams";
                case 11 -> "Lambdas and Functional Interfaces";
                case 12 -> "Design Patterns";
                default -> null;
            };
        } else if (idStr.endsWith("-000000000003")) { // BUILDER
            return switch (order) {
                case 1 -> "Spring Boot Fundamentals";
                case 2 -> "REST API Design";
                case 3 -> "Input Validation and Error Handling";
                case 4 -> "Spring Security Fundamentals";
                case 5 -> "JWT Authentication";
                case 6 -> "PostgreSQL Fundamentals";
                case 7 -> "Spring Data JPA";
                case 8 -> "Database Transactions";
                case 9 -> "Docker and Containerisation";
                case 10 -> "Integration and API Testing";
                case 11 -> "CI/CD and Deployment";
                default -> null;
            };
        } else if (idStr.endsWith("-000000000004")) { // ENGINEER
            return switch (order) {
                case 1 -> "System Design Foundations";
                case 2 -> "Distributed Systems Concepts";
                case 3 -> "Apache Kafka";
                case 4 -> "Redis and Caching";
                case 5 -> "Horizontal Scaling Patterns";
                case 6 -> "Kubernetes";
                case 7 -> "Observability and Monitoring";
                case 8 -> "Performance Engineering";
                default -> null;
            };
        } else if (idStr.endsWith("-000000000005")) { // ARCHITECT
            return switch (order) {
                case 1 -> "Domain-Driven Design";
                case 2 -> "CQRS";
                case 3 -> "Event Sourcing";
                case 4 -> "Platform Engineering";
                case 5 -> "Architecture Patterns and Trade-offs";
                case 6 -> "Technical Leadership";
                case 7 -> "Site Reliability Engineering";
                default -> null;
            };
        }
        return null;
    }
}
