# Security Policy

## Supported Scope

This project is a local development and experimentation app. It is not hardened for multi-tenant production use.

## Secrets

Never commit:

- `secrets/api-keys.txt`
- `.env`
- local SQLite databases
- logs containing prompts or provider responses

Use `secrets/api-keys.template.txt` as the public template.

## Reporting Issues

Report security issues privately to the repository maintainers. Do not open public issues containing secrets, exploit details, or private data.

## Before Deploying

If you adapt this project for hosted use, add your own review for:

- authentication
- rate limiting
- input size limits
- provider key protection
- data retention
- logging redaction
- dependency updates
