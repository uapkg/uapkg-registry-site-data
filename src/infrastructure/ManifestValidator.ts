import { createDiagnostic } from '../core/Diagnostic.js';
import { fail, ok, type Result } from '../core/Result.js';
import { PackageRegistryManifestSchema, type PackageRegistryManifest } from '../domain/RegistryManifestSchema.js';
import type { IManifestValidator } from '../contracts/Services.js';

export class ManifestValidator implements IManifestValidator {
  public validateManifest(raw: unknown, sourcePath: string): Result<PackageRegistryManifest> {
    const parsed = PackageRegistryManifestSchema.safeParse(raw);
    if (!parsed.success) {
      return fail(
        createDiagnostic('MANIFEST_SCHEMA_INVALID', 'error', 'Registry manifest schema validation failed.', {
          sourcePath,
          errors: parsed.error.flatten(),
        }),
      );
    }

    return ok(parsed.data);
  }
}
