# Architecture Design

## Class Model

### Core

- `Result<T>`
  - Responsibility: represent success/failure without throwing for expected failures.
- Diagnostic
  - Responsibility: structured machine-readable failure information.
- DiagnosticBag
  - Responsibility: aggregate diagnostics across pipeline stages.

### Configuration

- EnvConfigLoader
  - Responsibility: parse and validate environment configuration.
- EnvConfig
  - Responsibility: immutable runtime settings.

### Domain

- PackageManifestRecord
  - Responsibility: validated canonical package manifest model.
- PackageArtifact
  - Responsibility: website-facing package summary/detail payload.

### Infrastructure

- RegistrySourceClient
  - Responsibility: provide local path to registry content (local path or checked-out cache).
- ManifestScanner
  - Responsibility: discover manifest files under packages/*/*.json.
- ManifestValidator
  - Responsibility: validate manifest JSON shape against canonical schema contract.
- ReadmeFetcher
  - Responsibility: fetch repository README from default branch.
- MarkdownLinkRewriter
  - Responsibility: rewrite relative links/images to absolute GitHub/raw URLs.
- MarkdownSanitizer
  - Responsibility: convert markdown to safe HTML.
- ArtifactWriter
  - Responsibility: write deterministic JSON artifacts.

### Application

- BuildRegistrySiteDataUseCase
  - Responsibility: orchestrate end-to-end pipeline execution.

### CLI

- GenerateCommand
  - Responsibility: command entrypoint for running the use case.

## Relationships

- BuildRegistrySiteDataUseCase composes infrastructure services and EnvConfig.
- Infrastructure services depend on core contracts only (Result, Diagnostic).
- Domain types are shared between infrastructure and application.

## SOLID Validation

- Single Responsibility: each class has one narrow purpose.
- Open/Closed: new readers, sanitizers, and output writers can be added via interfaces.
- Liskov Substitution: interface-based services can be replaced with mocks/tests.
- Interface Segregation: thin interfaces per service avoid broad god contracts.
- Dependency Inversion: application depends on abstractions, not concrete filesystem/network implementations.

## Planned Extensions

- Multiple README fallback strategies (README.md, docs/README.md, package README path hints).
- Additional artifact versions with backward-compatible contract evolution.
- Optional historical version snapshot readme generation.
