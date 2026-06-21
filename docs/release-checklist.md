# Release Checklist

Use this checklist before publishing a release.

## Required

- `npm ci` completes from a clean clone.
- `npm run check` passes.
- `npm audit --audit-level=moderate` passes or findings are documented.
- `gitleaks dir . --no-banner --redact --verbose` reports no leaks.
- GitHub Actions `Check` workflow passes on `main`.
- License is AGPL-3.0-only in `package.json`.
- `LICENSE` contains the AGPL-3.0 text.
- No local databases, logs, or key files are committed.

## Demo Path

Confirm the README walkthrough still matches the local flow:

- `npm ci`
- `npm run dev:mock`
- open `http://localhost:8080`
- type `probability`
- answer the check
- confirm feedback and the next step

## Launch Prep

- Add or refresh the GIF walkthrough.
- Create a `v1.0.0` release tag.
- Prepare launch post copy.
- Confirm repo settings with owner.
