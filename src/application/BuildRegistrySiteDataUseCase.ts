import { readFile } from 'node:fs/promises';
import semver from 'semver';
import type { PackageRegistryManifest } from '@uapkg/registry-schema';
import type { EnvConfig } from '../config/EnvConfig.js';
import type { PackageDetailArtifact, PackageSummaryArtifact, PackageVersionArtifact } from '../contracts/Artifacts.js';
import type {
  IArtifactWriter,
  IManifestScanner,
  IManifestValidator,
  IMarkdownLinkRewriter,
  IMarkdownSanitizer,
  IReadmeFetcher,
  IRegistrySourceClient,
} from '../contracts/Services.js';
import { createDiagnostic } from '../core/Diagnostic.js';
import { DiagnosticBag } from '../core/DiagnosticBag.js';
import { fail, ok, type Result } from '../core/Result.js';

export interface BuildSummary {
  readonly packageCount: number;
  readonly outputDir: string;
}

export class BuildRegistrySiteDataUseCase {
  constructor(
    private readonly registrySourceClient: IRegistrySourceClient,
    private readonly manifestScanner: IManifestScanner,
    private readonly manifestValidator: IManifestValidator,
    private readonly readmeFetcher: IReadmeFetcher,
    private readonly markdownLinkRewriter: IMarkdownLinkRewriter,
    private readonly markdownSanitizer: IMarkdownSanitizer,
    private readonly artifactWriter: IArtifactWriter,
  ) {}

  public async run(config: EnvConfig): Promise<Result<BuildSummary>> {
    const diagnostics = new DiagnosticBag();

    const sourcePathResult = await this.registrySourceClient.resolveRegistryPath(config);
    if (!sourcePathResult.ok) {
      return fail(sourcePathResult.diagnostics);
    }
    diagnostics.addRange(sourcePathResult.diagnostics);

    const manifestPathsResult = await this.manifestScanner.scanManifestPaths(sourcePathResult.value);
    if (!manifestPathsResult.ok) {
      return fail(manifestPathsResult.diagnostics);
    }
    diagnostics.addRange(manifestPathsResult.diagnostics);

    const summaries: PackageSummaryArtifact[] = [];
    const details: PackageDetailArtifact[] = [];

    for (const manifestPath of manifestPathsResult.value) {
      const rawManifest = await this.readManifestJson(manifestPath);
      if (!rawManifest.ok) {
        diagnostics.addRange(rawManifest.diagnostics);
        continue;
      }

      const validatedManifest = this.manifestValidator.validateManifest(rawManifest.value, manifestPath);
      if (!validatedManifest.ok) {
        diagnostics.addRange(validatedManifest.diagnostics);
        continue;
      }

      const manifest = validatedManifest.value;
      const versions = this.buildVersionArtifacts(manifest.versions);
      const latestVersion = versions.length > 0 ? versions[0].version : undefined;
      const updatedAt = versions.find((entry) => typeof entry.publishedAt === 'number')?.publishedAt;
      const dependencyCountTotal = versions.reduce((total, entry) => total + entry.dependencyCount, 0);

      const readmeResult = await this.readmeFetcher.fetchReadmeMarkdown(
        manifest.packageSource.url,
        config.sourceDefaultBranch,
      );
      let readmeHtml: string | undefined;
      if (!readmeResult.ok) {
        diagnostics.addRange(readmeResult.diagnostics);
      } else {
        diagnostics.addRange(readmeResult.diagnostics);
        if (readmeResult.value) {
          const rewrittenMarkdown = this.markdownLinkRewriter.rewrite(
            readmeResult.value,
            manifest.packageSource.url,
            config.sourceDefaultBranch,
          );

          if (!rewrittenMarkdown.ok) {
            diagnostics.addRange(rewrittenMarkdown.diagnostics);
          } else {
            const sanitizedHtml = this.markdownSanitizer.renderSafeHtml(rewrittenMarkdown.value);
            if (!sanitizedHtml.ok) {
              diagnostics.addRange(sanitizedHtml.diagnostics);
            } else {
              readmeHtml = sanitizedHtml.value;
              diagnostics.addRange(sanitizedHtml.diagnostics);
            }
          }
        }
      }

      const summary: PackageSummaryArtifact = {
        name: manifest.name,
        sourceUrl: manifest.packageSource.url,
        latestVersion,
        versionCount: versions.length,
        updatedAt,
        searchMeta: {
          title: manifest.name,
          packageName: manifest.name,
          sourceUrl: manifest.packageSource.url,
          latestVersion,
          versionCount: versions.length,
          dependencyCountTotal,
        },
      };

      summaries.push(summary);
      details.push({
        ...summary,
        versions,
        readmeHtml,
      });
    }

    if (summaries.length === 0) {
      diagnostics.add(
        createDiagnostic(
          'NO_VALID_PACKAGES',
          'error',
          'No valid package manifests were processed from registry source.',
          {
            sourcePath: sourcePathResult.value,
          },
        ),
      );
      return fail(diagnostics.toArray());
    }

    const writeResult = await this.artifactWriter.writeArtifacts({
      outputDir: config.outputDir,
      summaries,
      details,
    });

    if (!writeResult.ok) {
      return fail([...diagnostics.toArray(), ...writeResult.diagnostics]);
    }

    diagnostics.addRange(writeResult.diagnostics);

    if (diagnostics.hasErrors()) {
      return fail(diagnostics.toArray());
    }

    return ok(
      {
        packageCount: summaries.length,
        outputDir: config.outputDir,
      },
      diagnostics.toArray(),
    );
  }

  private async readManifestJson(manifestPath: string): Promise<Result<unknown>> {
    try {
      const content = await readFile(manifestPath, 'utf8');
      return ok(JSON.parse(content));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail(
        createDiagnostic('MANIFEST_READ_FAILED', 'error', 'Failed to read or parse a package manifest file.', {
          manifestPath,
          message,
        }),
      );
    }
  }

  private buildVersionArtifacts(versions: PackageRegistryManifest['versions']): readonly PackageVersionArtifact[] {
    const versionKeys = Object.keys(versions) as Array<keyof typeof versions>;
    const hasSemverOnly = versionKeys.every((version) => Boolean(semver.valid(version)));
    const sortedVersions: Array<keyof typeof versions> = hasSemverOnly
      ? (semver.rsort(versionKeys) as Array<keyof typeof versions>)
      : [...versionKeys].sort((left, right) => right.localeCompare(left));

    return sortedVersions.map((version) => {
      const data = versions[version];
      const dependencies = data.dependencies ?? {};
      const devDependencies = data.devDependencies ?? {};
      const peerDependencies = data.peerDependencies ?? {};
      const dependencyCount =
        Object.keys(dependencies).length + Object.keys(devDependencies).length + Object.keys(peerDependencies).length;

      return {
        version: String(version),
        publishedAt: data.meta?.publishedAt,
        dependencyCount,
        gitTree: data.gitTree,
        packageFileUrl: data.releaseFiles.package.url,
        dependencies,
        devDependencies,
        peerDependencies,
      };
    });
  }
}
