import { z } from 'zod';

export const IntegritySchema = z
  .object({
    hash: z.string().min(1),
    size: z.number().int().nonnegative(),
  })
  .strict();

export const RegistryAssetSchema = z
  .object({
    url: z.string().url(),
    integrity: IntegritySchema,
  })
  .strict();

export const RegistryDependencySchema = z.union([
  z.string().min(1),
  z
    .object({
      version: z.string().min(1),
      registry: z.string().min(1).optional(),
    })
    .strict(),
]);

export const RegistryVersionSchema = z
  .object({
    gitTree: z.string().min(1),
    meta: z
      .object({
        publishedAt: z.number().int().nonnegative(),
      })
      .strict()
      .optional(),
    releaseFiles: z
      .object({
        package: RegistryAssetSchema,
      })
      .strict(),
    dependencies: z.record(z.string(), RegistryDependencySchema).optional(),
    devDependencies: z.record(z.string(), RegistryDependencySchema).optional(),
    peerDependencies: z.record(z.string(), RegistryDependencySchema).optional(),
  })
  .strict();

export const PackageRegistryManifestSchema = z
  .object({
    name: z.string().min(1),
    packageSource: z
      .object({
        type: z.literal('git'),
        url: z.string().url(),
      })
      .strict(),
    versions: z.record(z.string(), RegistryVersionSchema),
  })
  .strict();

export type PackageRegistryManifest = z.infer<typeof PackageRegistryManifestSchema>;
