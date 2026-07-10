# Merge Curriculum Seed

Production-quality seed data for the Merge engineering formation platform.
Scripts target MongoDB and use `mongosh`.

## Prerequisites

- MongoDB running at `localhost:27017` with replica set `rs0`
- `mongosh` installed (`mongosh --version` to verify)
- The application has been started at least once so that auto-index-creation
  has run (or run the scripts after the first Spring Boot startup)

## Run order

Run the scripts in numeric order. Each script is idempotent — re-running is safe.

```sh
mongosh "mongodb://localhost:27017/merge?replicaSet=rs0" seed/01_stages.js
mongosh "mongodb://localhost:27017/merge?replicaSet=rs0" seed/02_concepts.js
mongosh "mongodb://localhost:27017/merge?replicaSet=rs0" seed/03_resources.js
```

Or run them all at once:

```sh
for f in seed/0*.js; do
  mongosh "mongodb://localhost:27017/merge?replicaSet=rs0" "$f"
done
```

No app restart is needed. The scripts write directly to MongoDB and the data
is immediately available to the running application.

## What is seeded

| File | Collection(s) | Records |
|---|---|---|
| `01_stages.js` | `stages` | 5 stages |
| `02_concepts.js` | `concepts` | 53 concepts |
| `03_resources.js` | `resources` | 159 resources (3 per concept) |

Users are created through the application's own registration flow — no student
seed is provided.

## Curriculum structure

| Stage | XP threshold | Concepts |
|---|---|---|
| Scout | 500 | 15 — programming fundamentals |
| Cadet | 1 500 | 12 — OOP and Java platform |
| Builder | 3 000 | 11 — Spring Boot and backend engineering |
| Engineer | 5 000 | 8 — distributed systems at scale |
| Architect | 7 500 | 7 — strategic design and technical leadership |

`xpThreshold` doubles as the sort key that `ProgressionServiceImpl` uses to
determine stage order. The values must be strictly ascending.

## UUID format

All documents use `Binary(4)` UUIDs (BSON UUID subtype 4), matching the
`spring.data.mongodb.uuid-representation=standard` setting in
`application.properties`. In mongosh, `UUID("...")` produces this format.

## Stage UUID reference

These UUIDs are stable across all scripts. Reference them when adding new
concepts or resources manually.

| Stage | UUID |
|---|---|
| Scout | `10000000-1000-1000-1000-000000000001` |
| Cadet | `10000000-1000-1000-1000-000000000002` |
| Builder | `10000000-1000-1000-1000-000000000003` |
| Engineer | `10000000-1000-1000-1000-000000000004` |
| Architect | `10000000-1000-1000-1000-000000000005` |

## What is NOT seeded

- `concept_builds`, `level_builds` — student-specific activity records
- `drills`, `missions` — AI-generated per student session
- `instructors` — AI job queue records
- `sessions` — runtime session state
- `students`, `e_profiles`, `contexts`, `credentials` — created through the application's own registration and onboarding flow
