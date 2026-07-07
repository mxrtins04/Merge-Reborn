# Merge

Engineering formation platform for Nigerian CS undergraduates. A 3.5-year parallel track alongside a university degree that builds an alternative credential from evidence — not grades.

## What it does

Students work through concepts using the FACT framework: every concept opens with a real failure scenario, moves through explanation, curated resources, two Drills, and a Build. Failing a Drill or Build triggers a personalised Mission generated from the student's own failed attempt. Each stage closes with a Level_build capstone before promotion.

The credential is the student's engineering profile: state machine position, Builds passed, XP earned, reviewed Projects, and internship eligibility — all verifiable, all earned.

## Stack

**Backend:** Java 21 · Spring Boot 3 (modular monolith) · Spring Security · Spring Data MongoDB

**Frontend:** React 18 · TypeScript · Tailwind CSS · Vite

**Infrastructure:** MongoDB Atlas · Redis · Google Cloud Run · Docker · GitHub Actions

**Integrations:** Judge0 (code execution on Builds) · Gemini API (student-owned token, Mission generation and curriculum) · Bucket4j (rate limiting) · Testcontainers (integration testing) · Sentry (error monitoring)

## Architecture

Modular monolith. One deployable. Module boundaries are kept clean so extraction is a transport swap when scaling signals appear — not a rewrite.

Most of the system is synchronous. The only deferred path is slow third-party work: Concept_build and Level_build evaluation via Judge0, Mission generation via Gemini, audio generation, and the GitHub commit pipeline. These follow a 202 + job queue + polling pattern — submission is accepted instantly, a worker processes the slow call underground, and the frontend polls `GET /submissions/{id}` until the status is terminal.

The server is always the source of truth. The client reflects it.

## Prerequisites

- Java 21 (use JDK 21.0.5 from [Adoptium](https://adoptium.net) — JDK 25 is incompatible with Spring Boot 3, Lombok, and ASM)
- Node.js 18+
- Docker (for local MongoDB and Redis)
- MongoDB Atlas account (or local replica set — multi-document transactions require one)
- A Gemini API key

## Running locally

```bash
# Start MongoDB and Redis
docker run -d -p 27017:27017 --name mongo mongo:7 --replSet rs0
docker exec mongo mongosh --eval "rs.initiate()"
docker run -d -p 6379:6379 redis

# Clone and configure
git clone https://github.com/444notdotun/merge
cd merge
cp .env.example .env
# Fill in MONGODB_URI, REDIS_URI, JWT_SECRET, GEMINI_API_KEY

# Backend
./mvnw spring-boot:run

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string or local replica set URI |
| `REDIS_URI` | Redis connection URI |
| `JWT_SECRET` | 64-byte base64 secret (`openssl rand -base64 64`) |
| `JUDGE0_URL` | Judge0 instance URL |
| `SENTRY_DSN` | Sentry DSN for error monitoring |

Never commit secrets. Rotate immediately if exposed.

## Key decisions

**No EDA.** A job queue defers slow work within one deployable. EDA decouples services — Merge has no services to decouple.

**Polling over SSE/WebSocket.** Cloud Run kills idle instances. Polling is stateless and survives instance death; SSE and WebSocket connections don't.

**Drills are always string.** Judge0 runs only on Concept_build and Level_build submissions.

**Modular monolith with clean boundaries.** Extraction candidate if signals ever appear: the Evaluation module — it owns the slow dependency and scales on a different axis.

## Project status

Active build — Semicolon Africa capstone, MVP targeting 15 students.

Not yet on production URL. Will update when deployed.

## Built by

Adedotun Adewole · [github.com/444notdotun](https://github.com/444notdotun)
Olatunbosun Martins . [github.com/mxrtins04](https://github.com/mxrtins04)
