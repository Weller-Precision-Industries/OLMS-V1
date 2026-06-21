# Security Policy

## Supported Scope

This project is a local development and experimentation app. Review security controls carefully before adapting it for hosted use.

## Secrets

Never commit:

- `secrets/api-keys.txt`
- `.env`
- local SQLite databases
- logs containing prompts or provider responses

Use `secrets/api-keys.template.txt` as the public template.

## Reporting Issues

Report sensitive security issues directly to the repository maintainers. Do not open public issues containing secrets or exploit details.

## Before Deploying

If you adapt this project for hosted use, add your own review for:

- authentication
- rate limiting
- input size limits
- provider key protection
- data retention
- logging redaction
- dependency updates
