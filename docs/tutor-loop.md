# Tutor Loop

The loop is deliberately simple:

1. The learner enters a topic.
2. The server creates a SQLite session.
3. The tutor generates one teaching step.
4. The learner answers one check question.
5. The tutor returns feedback.
6. The server records the answer and feedback.
7. The next teaching step is generated.

The important property is continuity: every turn is stored locally, and each new step can see the recent event history.

## Why SQLite

SQLite keeps the project easy to run:

- no external database service
- one local file
- simple backup and deletion
- good fit for a single-user tutor demo

## Mock Mode

Mock mode exists so the loop works from a clean clone before anyone adds provider keys. It is also useful for UI work and demos where live AI calls are unnecessary.
