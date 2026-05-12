import path from 'node:path';
import process from 'node:process';
import { z } from 'zod';
import { createDiagnostic } from '../core/Diagnostic.js';
import { fail, ok, type Result } from '../core/Result.js';

const EnvConfigSchema = z
  .object({
    UAPKG_REGISTRY_REPO_OWNER: z.string().min(1).default('uapkg'),
    UAPKG_REGISTRY_REPO_NAME: z.string().min(1).default('registry-testing'),
    UAPKG_REGISTRY_REPO_REF: z.string().min(1).default('main'),
    UAPKG_REGISTRY_LOCAL_PATH: z.string().optional(),
    UAPKG_OUTPUT_DIR: z.string().min(1).default('./artifacts'),
    UAPKG_GITHUB_TOKEN: z.string().optional(),
    UAPKG_SOURCE_DEFAULT_BRANCH: z.string().min(1).default('main'),
  })
  .strict();

export interface EnvConfig {
  readonly registryRepoOwner: string;
  readonly registryRepoName: string;
  readonly registryRepoRef: string;
  readonly registryLocalPath?: string;
  readonly outputDir: string;
  readonly githubToken?: string;
  readonly sourceDefaultBranch: string;
  readonly cacheCheckoutPath: string;
}

export class EnvConfigLoader {
  public loadFromProcessEnv(): Result<EnvConfig> {
    const parsed = EnvConfigSchema.safeParse({
      UAPKG_REGISTRY_REPO_OWNER: process.env.UAPKG_REGISTRY_REPO_OWNER,
      UAPKG_REGISTRY_REPO_NAME: process.env.UAPKG_REGISTRY_REPO_NAME,
      UAPKG_REGISTRY_REPO_REF: process.env.UAPKG_REGISTRY_REPO_REF,
      UAPKG_REGISTRY_LOCAL_PATH: process.env.UAPKG_REGISTRY_LOCAL_PATH,
      UAPKG_OUTPUT_DIR: process.env.UAPKG_OUTPUT_DIR,
      UAPKG_GITHUB_TOKEN: process.env.UAPKG_GITHUB_TOKEN,
      UAPKG_SOURCE_DEFAULT_BRANCH: process.env.UAPKG_SOURCE_DEFAULT_BRANCH,
    });
    if (!parsed.success) {
      return fail(
        createDiagnostic('ENV_INVALID', 'error', 'Environment configuration is invalid.', {
          errors: parsed.error.flatten(),
        }),
      );
    }

    const config: EnvConfig = {
      registryRepoOwner: parsed.data.UAPKG_REGISTRY_REPO_OWNER,
      registryRepoName: parsed.data.UAPKG_REGISTRY_REPO_NAME,
      registryRepoRef: parsed.data.UAPKG_REGISTRY_REPO_REF,
      registryLocalPath: parsed.data.UAPKG_REGISTRY_LOCAL_PATH?.trim() || undefined,
      outputDir: path.resolve(parsed.data.UAPKG_OUTPUT_DIR),
      githubToken: parsed.data.UAPKG_GITHUB_TOKEN?.trim() || undefined,
      sourceDefaultBranch: parsed.data.UAPKG_SOURCE_DEFAULT_BRANCH,
      cacheCheckoutPath: path.resolve('.tmp', 'registry-source'),
    };

    return ok(config);
  }
}
