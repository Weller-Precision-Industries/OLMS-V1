# OLMS Classic

OLMS Classic is a local SQLite AI tutor loop. Type a topic, get a focused teaching step, answer a short check, receive feedback, and continue through a saved local session.

This repository is intentionally small. It does not include production OLMS systems, advanced planning, graph pipelines, managed database infrastructure, account systems, or operational tooling.

## What It Does

- Starts a local web server.
- Stores sessions and learning events in SQLite.
- Uses mock mode by default when no provider key is configured.
- Can call OpenAI for live teaching steps and answer feedback.
- Loads local API keys through the dev start script.

## Quickstart

Install dependencies:

```powershell
npm install
```

Run in mock mode:

```powershell
npm run dev:mock
```

Run with an API key:

```powershell
Copy-Item secrets\api-keys.template.txt secrets\api-keys.txt
notepad secrets\api-keys.txt
npm run dev
```

Open:

```text
http://localhost:8080
```

## Key Loading

`npm run dev` calls `scripts/dev/start-server.ps1`, which loads `secrets/api-keys.txt` before starting the server.

The shell equivalent is:

```bash
npm run dev:sh
```

Do not commit `secrets/api-keys.txt`.

## Mock Mode

Mock mode keeps the app runnable without paid API access:

```powershell
npm run dev:mock
```

You can also set:

```text
OLMS_MOCK_AI=true
```

## API

Start a session:

```http
POST /api/session/start
Content-Type: application/json

{ "topic": "probability" }
```

Submit an answer:

```http
POST /api/session/:id/answer
Content-Type: application/json

{ "answer": "Probability measures how likely an event is." }
```

Fetch a session:

```http
GET /api/session/:id
```

Health:

```http
GET /api/health
```

## Project Boundary

This is a classic local tutor loop. It is not a production learning platform and does not include private OLMS product systems.

See [docs/architecture.md](docs/architecture.md) and [docs/tutor-loop.md](docs/tutor-loop.md).
