import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { IArtifactWriter } from '../contracts/Services.js';
import { createDiagnostic } from '../core/Diagnostic.js';
import { fail, ok, type Result } from '../core/Result.js';

export class ArtifactWriter implements IArtifactWriter {
  public async writeArtifacts(input: {
    outputDir: string;
    summaries: readonly {
      name: string;
      sourceUrl: string;
      latestVersion?: string;
      versionCount: number;
      updatedAt?: number;
    }[];
    details: readonly {
      name: string;
      sourceUrl: string;
      latestVersion?: string;
      versionCount: number;
      updatedAt?: number;
      versions: readonly { version: string; publishedAt?: number; dependencyCount: number }[];
      readmeHtml?: string;
    }[];
  }): Promise<Result<void>> {
    const packagesDir = path.join(input.outputDir, 'packages');

    try {
      await rm(input.outputDir, { recursive: true, force: true });
      await mkdir(packagesDir, { recursive: true });

      const summaries = [...input.summaries].sort((left, right) => left.name.localeCompare(right.name));
      const details = [...input.details].sort((left, right) => left.name.localeCompare(right.name));

      await writeFile(
        path.join(packagesDir, 'index.json'),
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            packages: summaries,
          },
          null,
          2,
        ),
        'utf8',
      );

      await Promise.all(
        details.map((detail) =>
          writeFile(path.join(packagesDir, `${detail.name}.json`), JSON.stringify(detail, null, 2), 'utf8'),
        ),
      );

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail(
        createDiagnostic('ARTIFACT_WRITE_FAILED', 'error', 'Failed to write generated registry site artifacts.', {
          outputDir: input.outputDir,
          message,
        }),
      );
    }
  }
}
