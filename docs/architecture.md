# Architecture

OLMS Classic is intentionally small:

- `standalone-server.ts` owns HTTP routing.
- `src/tutor/store.ts` owns SQLite persistence.
- `src/tutor/ai.ts` owns mock and OpenAI-backed tutor behavior.
- `src/templates/main.html` owns the browser experience.
- `scripts/dev/start-server.ps1` and `scripts/dev/start-server.sh` load local keys before launch.

## Data Model

SQLite stores two tables:

- `sessions`: topic, status, created time, updated time.
- `events`: ordered teaching steps and learner answers.

The event log is the session transcript. The app can rebuild the learner-facing state from those events.

## Runtime Modes

Mock mode:

- no API key required
- deterministic local teaching steps
- simple heuristic feedback

OpenAI mode:

- uses `OPENAI_API_KEY`
- asks for JSON-only teaching steps and feedback
- stores returned steps and feedback in SQLite

## Deliberate Omissions

This project does not include:

- production auth
- paid-account systems
- analytics export
- managed database infrastructure
- advanced adaptive planning
- curriculum graph systems
- production operations scripts
