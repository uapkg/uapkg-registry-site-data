import { access, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import type { EnvConfig } from '../config/EnvConfig.js';
import { createDiagnostic } from '../core/Diagnostic.js';
import { fail, ok, type Result } from '../core/Result.js';
import type { IRegistrySourceClient } from '../contracts/Services.js';

const execFileAsync = promisify(execFile);

const exists = async (targetPath: string): Promise<boolean> => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

export class RegistrySourceClient implements IRegistrySourceClient {
  public async resolveRegistryPath(config: EnvConfig): Promise<Result<string>> {
    if (config.registryLocalPath) {
      const resolved = path.resolve(config.registryLocalPath);
      if (!(await exists(resolved))) {
        return fail(
          createDiagnostic('REGISTRY_LOCAL_PATH_NOT_FOUND', 'error', 'Configured local registry path was not found.', {
            path: resolved,
          }),
        );
      }

      return ok(resolved);
    }

    const targetPath = path.resolve(
      config.cacheCheckoutPath,
      `${config.registryRepoOwner}-${config.registryRepoName}-${config.registryRepoRef}`,
    );

    await mkdir(path.dirname(targetPath), { recursive: true });

    const alreadyCloned = await exists(targetPath);
    if (!alreadyCloned) {
      const cloneUrl = `https://github.com/${config.registryRepoOwner}/${config.registryRepoName}.git`;
      const cloneResult = await this.runGitCommand([
        'clone',
        '--depth',
        '1',
        '--branch',
        config.registryRepoRef,
        cloneUrl,
        targetPath,
      ]);
      if (!cloneResult.ok) {
        return cloneResult;
      }

      return ok(targetPath);
    }

    const fetchResult = await this.runGitCommand([
      '-C',
      targetPath,
      'fetch',
      'origin',
      config.registryRepoRef,
      '--depth',
      '1',
    ]);
    if (!fetchResult.ok) {
      return fetchResult;
    }

    const checkoutResult = await this.runGitCommand(['-C', targetPath, 'checkout', 'FETCH_HEAD']);
    if (!checkoutResult.ok) {
      return checkoutResult;
    }

    return ok(targetPath);
  }

  private async runGitCommand(args: readonly string[]): Promise<Result<void>> {
    try {
      await execFileAsync('git', [...args]);
      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail(
        createDiagnostic('GIT_COMMAND_FAILED', 'error', 'Git command failed while preparing registry source.', {
          args,
          message,
        }),
      );
    }
  }
}
