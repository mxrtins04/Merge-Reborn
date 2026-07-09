# Merge — Final Technical PRD — v2.0
### Consolidated Source of Truth — Domain Model, Architecture Decisions, Service Ownership

This document consolidates Addenda v1.0 through v1.4, the 06 July 2026 architecture decision
session, and the resulting service ticket breakdown into one authoritative reference. It replaces
the addendum chain as the document to build from. Two companion documents remain in active use
alongside it: `Merge_UML_Class_Diagram_v1.6.drawio` (visual domain model, kept in sync with §2) and
`Merge_Service_Tickets_v1.md` (per-service execution breakdown, kept in sync with §9). Where any
prior addendum conflicts with this document, this document is authoritative.

## 1. What This Document Is, and Isn't

- It is the current, complete domain model, the closed architecture decisions from the 06 July
  session, and a map of which service owns what.
- It is not a resolution of every open question. Five items are explicitly still open (§8) and one
  is explicitly blocking (§7.7). This document states them clearly rather than quietly defaulting an
  answer for any of them.
- Prior addenda (v1.0–v1.4) are historical record only. Do not build against them where this
  document differs.

## 2. Domain Model

| Entity | Field | Type | Notes |
|---|---|---|---|
| Student | id | UUID (PK) | |
| | email | String (unique index) | Added mid-project — see auth note below §2 |
| | passwordHash | String | BCrypt strength 12, never returned in any response DTO |
| | name | String | |
| | details | String | Meaning not yet defined |
| | xp | int | |
| | stageId | UUID (FK → Stage) | |
| | internshipEligible | boolean | Set true only by an approved Project |
| Context | id | UUID (PK) | |
| | studentId | UUID (FK → Student) | 1:1 |
| | personalisedData | JSON | OPEN — internal structure not yet defined (§8) |
| E.Profile | id | UUID (PK) | |
| | studentId | UUID (FK → Student) | 1:1 |
| | competencyData | JSON | OPEN — currently 8 SFIA dimensions only; scope may expand (§8) |
| Session | id | UUID (PK) | |
| | studentId, conceptId | UUID (FK x2) | Session is scoped to one Concept for its duration |
| | mood, type | SessionMood, SessionType | mood: FRESH/OKAY/EXHAUSTED · type: FULL_FORCE/EXHAUSTED |
| | startedAt, endedAt, lastActivityAt | DateTime x3 | |
| | endReason | EndReason | NORMAL / IDLE_TIMEOUT |
| Stage ("Level") | id | UUID (PK) | |
| | name | String | |
| | xpThreshold | int | Promotion condition 1 of 3 |
| | buildPassRequired | int | Count of concepts whose Concept_build must pass; promotion condition 2 of 3 |
| Concept | id | UUID (PK) | |
| | stageId | UUID (FK → Stage) | |
| | predefinedContentRef | String | Resolved via CURRICULUM_WRITE into the explanation/problem statement |
| Resources | id | UUID (PK) | |
| | conceptId | UUID (FK → Concept) | |
| | type, title, url | String x3 | No XP — informational only |
| Drill | id | UUID (PK) | |
| | conceptId, studentId | UUID (FK x2) | |
| | question, answer | String, String | Always string Q&A — no code Drills, no Judge0 (§7.6) |
| | passed, xpAwarded | boolean, boolean | xpAwarded guards single payout, no decay |
| | feedback | JSON | |
| | status | SubmissionStatus | Coordination field for deferred Mission generation on failure |
| | serverDeadline, answeredAt | DateTime x2 | Comprehension-check timer mechanism |
| | idempotencyKey | String | |
| Concept_build | id | UUID (PK) | |
| | conceptId, studentId | UUID (FK x2) | 1:1 with Concept |
| | passed, xpAwarded | boolean, boolean | |
| | feedback, status | JSON, SubmissionStatus | Lighter gate set: hidden tests, own TDD suite, comprehension check |
| | githubLink, idempotencyKey | String, String | |
| Level_build | id | UUID (PK) | |
| | stageId, studentId | UUID (FK x2) | 1:1 with Stage — the stage capstone |
| | passed, xpAwarded | boolean, boolean | |
| | cleanCodeScore, sfiaAligned | int, boolean | Gates not present on Concept_build |
| | feedback, status | JSON, SubmissionStatus | Full five-gate set |
| | githubLink, idempotencyKey | String, String | |
| Mission | id | UUID (PK) | |
| | conceptId, studentId | UUID (FK x2) | Keyed to Concept, not Drill |
| | conceptAndContext | String | Generated from the failed attempt blended with Context |
| | passed | boolean | OPEN — retry logic deferred (§8) |
| Project | id | UUID (PK) | |
| | studentId | UUID (FK → Student) | |
| | given, link, prd, review | String x4 | Sourced externally; approval sets Student.internshipEligible |
| Instructor | id | UUID (PK) | |
| | actionType | ActionType (enum, 9 values) | See §4. Not tied to any entity by foreign key |

**Auth note (mid-project addition, 2026-07-09):** Authentication was not one of the original eight tickets in this PRD. It was added mid-project under direct engineer instruction as identity infrastructure that every other ticket depends on. The implementation lives in `com.merge.merge.shared.security` (JWT issuance, Spring Security filter chain, rate limiting, refresh token rotation, password reset) and `com.merge.merge.identity.service.AuthService`. `email` and `passwordHash` were added to Student at that time — they are not PRD-original fields. The six real HTTP endpoints produced by this work are documented in §9.

## 3. Relationships

Student holds a 1:1 relationship to Context and to E.Profile, and a many:1 relationship to Stage.
Student has one:many Sessions, Drills, Concept_builds, Level_builds, Missions, and Projects.

Stage contains many Concepts and has exactly one Level_build. Concept has many Resources, many
Drills, many Missions, and exactly one Concept_build.

Session is scoped to a single Concept for its duration. Instructor is not tied to any entity by
foreign key — it generates Drills, Missions, and Projects, and reviews Concept_builds and
Level_builds, all as triggered actions (§4).

## 4. Instructor Action Types

| actionType | Trigger |
|---|---|
| CURRICULUM_WRITE | Concept opened |
| DRILL_GENERATE | Drill requested |
| COMPREHENSION_GENERATE | A submission passes tests |
| CLEAN_CODE_REVIEW | Comprehension check passes |
| BUILD_PRD_GENERATE | A build unlocks (per concept) |
| AUDIO_REINFORCE | Session marked exhausted, mid-concept |
| AUDIO_PRIME | Session marked exhausted, concept complete |
| REFLECT | A build or graduation completes |
| DISENGAGEMENT_COACH | Weekly Momentum Score goes BLOCKED or OFFLINE |

## 5. Build Model — Two Entities, Three-Condition Promotion

Two build entities exist, with different gate sets:

- **Concept_build** — one per concept, lighter gate set (hidden tests, the student's own TDD suite,
  comprehension check). Passing it unlocks the next concept.
- **Level_build** — one per stage, full five-gate set (adds Clean Code rubric and SFIA alignment
  verification). Functions as the stage capstone.

Stage promotion requires three conditions:

```
canPromote(studentId, stageId):
  allConceptBuildsPassed = getAllConcepts(stageId)
      .allMatch(c => getConceptBuild(studentId, c.id)?.passed == true)
  xpMet = student.totalXp >= stage.xpThreshold
  levelBuildPassed = getLevelBuild(studentId, stageId)?.passed == true

  return allConceptBuildsPassed && xpMet && levelBuildPassed
```

**Open (§8, Ticket 4):** what happens when all Concept_builds pass and the XP threshold is met, but
Level_build fails — whether the student is stuck at the last concept, or has a distinct retry path
from Concept_build's. Not to be defaulted silently; document whichever answer is chosen.

## 6. XP Model

- No decay on retries. Each Drill and each Concept_build pays a fixed XP amount exactly once,
  guarded by the xpAwarded flag.
- Viewing a learning resource pays 0 XP.
- Level_build pays more than any single Concept_build — exact figures for both not yet set.
- Project never awards XP — it gates Student.internshipEligible only.

## 7. Architecture Decisions (closed 06 July 2026)

*These decisions were reached in a design session on 06 July 2026 and supersede any prior OPEN
status on the items they cover.*

### 7.1 Synchronous by default

Merge is synchronous by default. The choice between synchronous and deferred processing is made
per endpoint based on duration, not domain. Fast operations — session gate checks, Drill string
evaluation, XP award, promotion check, login, registration, content fetch, session creation —
complete in milliseconds and return in the same HTTP response. Deferred processing applies only
where a third-party dependency makes synchronous handling unsafe on the request thread.

### 7.2 Deferred operations via job queue

Deferred: Concept_build and Level_build evaluation via Judge0 (10–40 seconds), Gemini Mission
generation on Drill or Build failure, audio generation (AUDIO_REINFORCE / AUDIO_PRIME), and the
GitHub commit pipeline. The controller accepts the submission, writes the record with status
QUEUED, enqueues a job, and returns HTTP 202 with a submissionId. A background worker calls the
external service and writes the result to MongoDB. Blocking the request thread on a 30-second
Judge0 call would exhaust the thread pool and trigger gateway timeouts.

### 7.3 Event-driven architecture — rejected

Kafka and broker-based EDA are not used in Merge. EDA solves independent services sharing data
without coupling; Merge is a modular monolith with one deployable and no service boundaries to
decouple. A job queue defers slow work within one deployable — a different tool for a different
problem. In-process Spring events (@EventListener, @TransactionalEventListener) remain an option
as a future seam, but are not an MVP requirement.

### 7.4 Result delivery — polling

The frontend learns evaluation results by polling: after HTTP 202, it stores the submissionId and
polls `GET /submissions/{id}` every 3 seconds until status reaches a terminal value. SSE and
WebSocket were considered and rejected — Merge runs on Cloud Run, which kills idle instances at
will, so long-lived connections die with the instance. Each poll is answerable by any instance
because truth lives in MongoDB, not in memory.

### 7.5 Submission status enum

```
enum SubmissionStatus {
  QUEUED,              // accepted, waiting in queue
  RUNNING,              // worker calling Judge0
  PASSED,               // verdict passing, XP awarded, session may close
  FAILED,               // verdict failing, Mission generation enqueued
  MISSION_GENERATING,   // worker calling Gemini
  MISSION_READY         // Mission written, missionId available
}
```

Crash recovery is automatic: the one-active-session invariant tells the app where to look, and the
status in MongoDB tells it what is true.

### 7.6 Drill type clarification

Drills are always string question and string answer. There are no code Drills. Judge0 runs only on
Concept_build and Level_build submissions. No drillType enum is needed.

### 7.7 Job queue implementation — OPEN, BLOCKING

**Requires a whiteboard session with both co-founders before ticket-writing begins on any
deferred-submission endpoint.**

BullMQ is a Node.js library; the Merge backend is Java 21 with Spring Boot 3 — different runtimes,
BullMQ cannot be called directly from Java. This blocks implementation of §7.2 as written. Options
to evaluate: a Java-native queue backed by Redis using Spring task execution, a separate Node.js
worker process consuming from a Redis queue, or an alternative queue technology with a native Java
client. Blocks Ticket 4 (Build & Gating) and any async Instructor action in Ticket 7.

## 8. Open Issues

| Issue | Status | Note |
|---|---|---|
| Context.personalisedData structure | Open | Internal shape not defined (Ticket 1) |
| E.Profile scope | Open | Beyond 8 SFIA dimensions: project completion rate, level/novelty of thinking, consistency (Ticket 1) |
| Comprehension check as sole anti-cheat measure | Open, flagged insufficient | Ticket 3 owner must propose additional mechanisms |
| Mission retry logic | Deferred | Limits and escalation not decided (Ticket 5) |
| Project sourcing mechanism | Open | AI-generated vs. manually curated for MVP (Ticket 8) |
| Job queue implementation | Open — BLOCKING | BullMQ/Java runtime mismatch. See §7.7 |
| Password reset email sent synchronously | Open, stopgap | Self-owned auth's password-reset email sends within the request thread, not deferred, because §7.7's job queue is blocking. Per §7.2's own reasoning this is exactly the kind of third-party call that should be deferred. Move to the job queue once §7.7 unblocks; not intended as the permanent architecture. |
| Refresh cookie Secure flag | **Resolved 2026-07-09** | Was hardcoded `.secure(true)`, breaking dev HTTP flows. Now reads `${cookie.secure:true}` — set `cookie.secure=false` in a local dev profile to run without HTTPS. Test profile sets it false by default. |

## 9. Service Ownership Map

Full detail lives in `Merge_Service_Tickets_v1.md` — this is a navigation summary only.

| # | Service | Owns | Sharpest open question |
|---|---|---|---|
| 1 | Identity & Personalization | Student, Context, E.Profile | What belongs in personalisedData, and whether it needs history |
| 2 | Curriculum & Progression | Stage, Concept, Resources | Whether buildPassRequired is stored or derived at read time |
| 3 | Practice | Drill (incl. comprehension timer) | What anti-cheat mechanism goes beyond the timer |
| 4 | Build & Gating | Concept_build, Level_build, promotion function | How gates from different sources combine into one pass/fail on Level_build |
| 5 | Remediation | Mission | Safe default retry behavior, isolated behind an interface |
| 6 | Session | Session (mood, type, exhaustion) | How one-active-session is enforced at the database level |
| 7 | AI Orchestration | Instructor, all 9 actionTypes | One dispatch service vs. each trigger source calling Instructor directly |
| 8 | Project & Eligibility | Project, Student.internshipEligible | AI-generated vs. manually curated Project sourcing for MVP |

### Real API Surface (implemented, tested, as of 2026-07-09)

**Authentication** — not in the original eight tickets; added mid-project (see auth note above §3). All endpoints are public (no JWT required). Rate-limited at the controller level via `@RateLimited`.

| Method | Path | Auth required | Notes |
|---|---|---|---|
| POST | /api/v1/auth/register | No | 3 req/hr per IP. Creates Student, issues access token + refresh cookie |
| POST | /api/v1/auth/login | No | 5 req/15 min per email. Issues access token + refresh cookie |
| POST | /api/v1/auth/refresh | No | Reads HttpOnly refresh cookie; rotates token |
| POST | /api/v1/auth/logout | No | Revokes refresh token; clears cookie |
| POST | /api/v1/auth/password-reset/request | No | Sends reset token via email (synchronous stopgap — see §8) |
| POST | /api/v1/auth/password-reset/confirm | No | Validates token, sets new password |

**Identity** — requires valid JWT on all endpoints.

| Method | Path | Auth required | Notes |
|---|---|---|---|
| GET | /api/v1/students/me | Yes | Returns StudentResponse (no passwordHash) |
| GET | /api/v1/students/me/profile | Yes | Returns EProfileResponse |

**Curriculum** — requires valid JWT on all endpoints.

| Method | Path | Auth required | Notes |
|---|---|---|---|
| GET | /api/v1/stages | Yes | List all stages |
| GET | /api/v1/stages/{id} | Yes | Get stage by id; 404 if unknown |
| GET | /api/v1/concepts?stageId={id} | Yes | List concepts for a stage |
| GET | /api/v1/concepts/{id} | Yes | Get concept by id; 404 if unknown |
| GET | /api/v1/concepts/{id}/resources | Yes | List resources; 404 if concept unknown |

**Session** — requires valid JWT (covered by global security filter chain).

| Method | Path | Auth required | Notes |
|---|---|---|---|
| POST | /api/v1/sessions/{id}/end | Yes | Ends an open session; 400/404/409 on invalid input |

## 10. Companion Documents

- `Merge_UML_Class_Diagram_v1.6.drawio` / `.jsx` — canonical visual domain model
- `Merge_Service_Tickets_v1.md` — full per-service breakdown; the actual work assignment
- `Merge_Learning_Agent_Brief.md` — companion for AI-assisted learning, not a build reference

---
*End of Final PRD v2.0. Historical addenda (v1.0–v1.4) remain available for context but are no
longer the build reference.*
