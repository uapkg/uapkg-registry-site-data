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

## Git Hooks (Husky)

Husky is initialized through the prepare script during install.

- prepare script: pnpm prepare
- automatic on dependency install: pnpm install
- manual re-init (if hooks are missing): pnpm prepare

## Line Endings

This repository is normalized to LF line endings.

- .gitattributes enforces LF for committed text files.
- .editorconfig sets end_of_line = lf for editors.
- Biome formatter is configured with lineEnding = lf.

If you have local CRLF files from previous clones, run a one-time renormalization after pulling these changes:

- git add --renormalize .

## GitHub Actions Configuration

Workflow [generate-site-data.yml](.github/workflows/generate-site-data.yml) uses the following settings.

Repository secrets:

- GITHUB_TOKEN: automatically provided by GitHub Actions (used as UAPKG_GITHUB_TOKEN)

Repository variables (optional, defaults are already in workflow):

- UAPKG_REGISTRY_REPO_OWNER (default: uapkg)
- UAPKG_REGISTRY_REPO_NAME (default: registry-testing)
- UAPKG_REGISTRY_REPO_REF (default: main)

## Output

Generated artifacts are written to artifacts by default.
