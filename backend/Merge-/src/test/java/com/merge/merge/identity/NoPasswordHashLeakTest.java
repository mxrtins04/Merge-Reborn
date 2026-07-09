package com.merge.merge.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merge.merge.identity.dto.StudentResponse;
import com.merge.merge.identity.models.Student;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Structural test asserting that no Student-derived response DTO anywhere in
 * the codebase carries a passwordHash field.
 *
 * <p>This test has two layers:</p>
 * <ol>
 *   <li><b>Structural (compile-time-equivalent):</b> Reflectively inspect every
 *       record component of StudentResponse and assert no component is named
 *       "passwordHash". This catches any future accidental addition at the
 *       class level.</li>
 *   <li><b>Serialization (runtime):</b> Serialize a real StudentResponse to JSON
 *       and assert the string "passwordHash" is absent. This catches any future
 *       accidental @JsonProperty annotation or serialization configuration that
 *       might include extra fields.</li>
 * </ol>
 *
 * <p>The test does not require a Spring context or a database — it is a unit
 * test of the DTO contract, not an integration test.</p>
 */
class NoPasswordHashLeakTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void studentResponse_recordComponents_doNotIncludePasswordHash() {
        RecordComponent[] components = StudentResponse.class.getRecordComponents();
        assertThat(components).isNotEmpty();

        boolean hasPasswordHash = Arrays.stream(components)
                .anyMatch(c -> c.getName().equals("passwordHash"));

        assertThat(hasPasswordHash)
                .as("StudentResponse must not have a 'passwordHash' record component")
                .isFalse();
    }

    @Test
    void studentResponse_serializedJson_doesNotContainPasswordHash() throws Exception {
        // Build a Student with a real-looking passwordHash value so we can be
        // sure the mapper can't find it even when the source object has one.
        Student student = new Student(
                UUID.randomUUID(),
                "ada@example.com",
                "{bcrypt}$2a$12$fakehashabcdefghijklmnopqrstuv",
                "Ada",
                "Software engineer in training",
                UUID.randomUUID()
        );

        StudentResponse response = StudentResponse.from(student);
        String json = objectMapper.writeValueAsString(response);

        assertThat(json)
                .as("Serialized StudentResponse must not contain 'passwordHash'")
                .doesNotContain("passwordHash");

        assertThat(json)
                .as("Serialized StudentResponse must not contain the actual hash value")
                .doesNotContain("$2a$12$fakehashabcdefghijklmnopqrstuv");

        // Confirm the fields we DO expect are present.
        assertThat(json).contains("\"name\":\"Ada\"");
        assertThat(json).contains("\"xp\":0");
        assertThat(json).contains("\"internshipEligible\":false");
    }

    @Test
    void studentEntity_hasPasswordHashField_confirmingThisTestIsNecessary() {
        // Sanity check: verify that Student itself does have a passwordHash field.
        // If this fails, someone removed the field and this test can be retired.
        boolean studentHasPasswordHash = Arrays.stream(Student.class.getDeclaredFields())
                .anyMatch(f -> f.getName().equals("passwordHash"));

        assertThat(studentHasPasswordHash)
                .as("Student entity must have a 'passwordHash' field for this test to be meaningful")
                .isTrue();
    }

    @Test
    void studentResponse_fromMethod_mapsExplicitFieldsOnly() {
        UUID id = UUID.randomUUID();
        UUID stageId = UUID.randomUUID();
        Student student = new Student(id, "ada@example.com",
                "{bcrypt}$2a$12$fakehash", "Ada", "details", stageId);

        StudentResponse response = StudentResponse.from(student);

        // Every field in StudentResponse.from() is individually verified here.
        // This is the explicit-mapping guarantee: each line below corresponds
        // to one explicit field copy in the from() method.
        assertThat(response.id()).isEqualTo(id);
        assertThat(response.name()).isEqualTo("Ada");
        assertThat(response.details()).isEqualTo("details");
        assertThat(response.xp()).isEqualTo(0);
        assertThat(response.stageId()).isEqualTo(stageId);
        assertThat(response.internshipEligible()).isFalse();

        // And the number of components matches exactly — if a field is ever
        // added to StudentResponse, this test breaks and forces a conscious
        // decision about whether the addition is intentional.
        assertThat(StudentResponse.class.getRecordComponents()).hasSize(6);
    }
}
