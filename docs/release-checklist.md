# Release Checklist

Use this checklist before changing the repository from private to public.

## Required

- `npm ci` completes from a clean clone.
- `npm run check` passes.
- `npm audit --audit-level=moderate` passes or findings are documented.
- `gitleaks dir . --no-banner --redact --verbose` reports no leaks.
- GitHub Actions `Check` workflow passes on `main`.
- License is AGPL-3.0-only in `package.json`.
- `LICENSE` contains the AGPL-3.0 text.
- No private OLMS product systems are present.
- No local databases, logs, or key files are committed.

## Product Boundary

Confirm the public repo contains only:

- local topic entry
- AI or mock tutor steps
- answer feedback
- SQLite session storage
- small local web UI
- key-loading dev scripts

Confirm the public repo does not contain:

- production OLMS platform code
- graph pipelines
- advanced planning engines
- managed database infrastructure
- account systems
- paid-account systems
- private prompts or evaluations
- operational runbooks

## Launch Prep

- Add screenshot or short demo recording.
- Create a `v1.0.0` release tag.
- Prepare launch post copy.
- Confirm repo visibility change with owner.
