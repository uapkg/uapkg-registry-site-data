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

- GITHUB_TOKEN: automatically provided by GitHub Actions (used as UAPKG_GITHUB_TOKEN for API-based README fetches)
- PRIVATE_REGISTRY_TOKEN: optional token used only to clone/fetch UAPKG_REGISTRY_REPO_NAME when that repository is private

Private registry access notes:

- The default GITHUB_TOKEN in this workflow is scoped to the current repository and cannot read arbitrary private repositories in the organization.
- If UAPKG_REGISTRY_REPO_NAME points to a private repository (for example uapkg/registry-testing), configure PRIVATE_REGISTRY_TOKEN.
- Recommended for 2026: use a fine-grained token scoped only to the private registry repository with:
	- Repository access: Only select repositories
	- Selected repository: uapkg/registry-testing (or whichever private registry source you configured)
	- Repository permissions: Contents (Read), Metadata (Read)

Repository variables (optional, defaults are already in workflow):

- UAPKG_REGISTRY_REPO_OWNER (default: uapkg)
- UAPKG_REGISTRY_REPO_NAME (default: registry-testing)
- UAPKG_REGISTRY_REPO_REF (default: main)

Environment variables used by generate:

- UAPKG_REGISTRY_REPO_TOKEN: optional clone/fetch token for private registry source repositories

## Output

Generated artifacts are written to artifacts by default.
