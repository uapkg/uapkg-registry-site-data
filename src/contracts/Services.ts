import type { EnvConfig } from '../config/EnvConfig.js';
import type { PackageDetailArtifact, PackageSummaryArtifact } from './Artifacts.js';
import type { Result } from '../core/Result.js';
import type { PackageRegistryManifest } from '../domain/RegistryManifestSchema.js';

export interface IRegistrySourceClient {
  resolveRegistryPath(config: EnvConfig): Promise<Result<string>>;
}

export interface IManifestScanner {
  scanManifestPaths(registryPath: string): Promise<Result<readonly string[]>>;
}

export interface IManifestValidator {
  validateManifest(raw: unknown, sourcePath: string): Result<PackageRegistryManifest>;
}

export interface IReadmeFetcher {
  fetchReadmeMarkdown(sourceRepoUrl: string, branch: string): Promise<Result<string | undefined>>;
}

export interface IMarkdownLinkRewriter {
  rewrite(markdown: string, sourceRepoUrl: string, branch: string): Result<string>;
}

export interface IMarkdownSanitizer {
  renderSafeHtml(markdown: string): Result<string>;
}

export interface IArtifactWriter {
  writeArtifacts(input: {
    outputDir: string;
    summaries: readonly PackageSummaryArtifact[];
    details: readonly PackageDetailArtifact[];
  }): Promise<Result<void>>;
}
