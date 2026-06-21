# Launch Notes

Working headline:

> OLMS-V1: a local SQLite AI tutor loop that turns any topic into a guided learning session.

Short description:

> OLMS-V1 is the early open-source OLMS learning loop: type a topic, get a teaching step, answer a check, receive feedback, and continue through a local SQLite-backed session. It runs in mock mode without an API key and supports live OpenAI calls when configured.

Suggested launch bullets:

- Runs locally with Node and SQLite.
- Works in mock mode from a clean clone.
- Uses a small HTTP API and plain browser UI.
- Loads provider keys from a local ignored file.
- Licensed AGPL-3.0-only.

Suggested first demo topic:

```text
probability
```

Suggested demo path:

1. `npm install`
2. `npm run dev:mock`
3. Open `http://localhost:8080`
4. Type `probability`
5. Submit an answer and show the next tutor step
