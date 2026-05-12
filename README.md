# UAPKG Registry Site Data

Static data-generation pipeline for the UAPKG web registry.

## Responsibilities

- Read canonical manifests from a configured registry repository.
- Validate incoming JSON at trust boundaries.
- Fetch package README content from source repositories.
- Rewrite relative links and image URLs.
- Sanitize rendered markdown for static web consumption.
- Generate deterministic artifacts for uapkg-web.

## Commands

- pnpm install
- pnpm generate
- pnpm verify

## Output

Generated artifacts are written to artifacts by default.
