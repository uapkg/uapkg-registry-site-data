# uapkg Registry Site Data

Static data-generation pipeline for the uapkg web registry.

## Responsibilities

- Read canonical manifests from a configured registry repository.
- Validate incoming JSON.
- Fetch package README content from source repositories.
- Rewrite relative links and image URLs.
- Sanitize rendered markdown for static web consumption.
- Generate artifacts for uapkg-web.

## Commands

- pnpm install
- pnpm generate
- pnpm verify

## Local Bootstrap

Use this when you want to generate artifacts from a local registry repository checkout.

Create a `.env` file in this repository and run generate:

```text
uapkg_REGISTRY_LOCAL_PATH=D:/uapkg/registry-testing
```

then run

```sh
pnpm generate
```

Optional explicit repo settings (not required when using uapkg_REGISTRY_LOCAL_PATH):

```text
uapkg_REGISTRY_REPO_OWNER=uapkg
uapkg_REGISTRY_REPO_NAME=registry-testing
uapkg_REGISTRY_REPO_REF=main
```

For end-to-end local web integration from `uapkg-web`, use:

```text
uapkg_SITE_DATA_REPO_PATH=D:/uapkg/uapkg-registry-site-data
uapkg_REGISTRY_LOCAL_PATH=D:/uapkg/registry-testing

```sh
pnpm site-data:generate:testing
```

This bypasses remote clone/fetch and reads manifests directly from the local filesystem.

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

- GITHUB_TOKEN: automatically provided by GitHub Actions (used as uapkg_GITHUB_TOKEN for API-based README fetches)
- PRIVATE_REGISTRY_TOKEN: optional token used only to clone/fetch uapkg_REGISTRY_REPO_NAME when that repository is private

Private registry access notes:

- The default GITHUB_TOKEN in this workflow is scoped to the current repository and cannot read arbitrary private repositories in the organization.
- If uapkg_REGISTRY_REPO_NAME points to a private repository (for example uapkg/registry-testing), configure PRIVATE_REGISTRY_TOKEN.
- Recommended for 2026: use a fine-grained token scoped only to the private registry repository with:
  - Repository access: Only select repositories
  - Selected repository: uapkg/registry-testing (or whichever private registry source you configured)
  - Repository permissions: Contents (Read), Metadata (Read)

Repository variables (optional, defaults are already in workflow):

- uapkg_REGISTRY_REPO_OWNER (default: uapkg)
- uapkg_REGISTRY_REPO_NAME (default: registry-testing)
- uapkg_REGISTRY_REPO_REF (default: main)

Environment variables used by generate:

- uapkg_REGISTRY_REPO_TOKEN: optional clone/fetch token for private registry source repositories

## Output

Generated artifacts are written to artifacts by default.
