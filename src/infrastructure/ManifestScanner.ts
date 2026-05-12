import fg from 'fast-glob';
import { createDiagnostic } from '../core/Diagnostic.js';
import { fail, ok, type Result } from '../core/Result.js';
import type { IManifestScanner } from '../contracts/Services.js';

export class ManifestScanner implements IManifestScanner {
  public async scanManifestPaths(registryPath: string): Promise<Result<readonly string[]>> {
    try {
      const files = await fg('packages/*/*.json', {
        cwd: registryPath,
        absolute: true,
      });

      files.sort((left, right) => left.localeCompare(right));
      return ok(files);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail(
        createDiagnostic('MANIFEST_SCAN_FAILED', 'error', 'Unable to scan registry manifest files.', {
          registryPath,
          message,
        }),
      );
    }
  }
}
