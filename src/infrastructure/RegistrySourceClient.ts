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

interface CloneEndpoint {
  readonly authMode: 'registry-token' | 'github-token' | 'public';
  readonly actual: string;
  readonly diagnostic: string;
}

const getTokenShape = (token: string): 'fine-grained' | 'classic' | 'github-actions' | 'unknown' => {
  if (token.startsWith('github_pat_')) {
    return 'fine-grained';
  }

  if (token.startsWith('ghp_')) {
    return 'classic';
  }

  if (token.startsWith('ghs_')) {
    return 'github-actions';
  }

  return 'unknown';
};

const buildAuthenticatedGithubUrl = (owner: string, repo: string, token: string): string => {
  const encodedToken = encodeURIComponent(token);
  const tokenShape = getTokenShape(token);

  if (tokenShape === 'fine-grained' || tokenShape === 'classic') {
    const username = process.env.UAPKG_REGISTRY_REPO_TOKEN_USERNAME ?? process.env.GITHUB_ACTOR ?? 'git';
    return `https://${encodeURIComponent(username)}:${encodedToken}@github.com/${owner}/${repo}.git`;
  }

  return `https://x-access-token:${encodedToken}@github.com/${owner}/${repo}.git`;
};

const buildCloneEndpoints = (config: EnvConfig): readonly CloneEndpoint[] => {
  const publicUrl = `https://github.com/${config.registryRepoOwner}/${config.registryRepoName}.git`;
  const endpoints: CloneEndpoint[] = [];

  if (config.registryRepoToken) {
    endpoints.push({
      authMode: 'registry-token',
      actual: buildAuthenticatedGithubUrl(config.registryRepoOwner, config.registryRepoName, config.registryRepoToken),
      diagnostic: `https://x-access-token:***@github.com/${config.registryRepoOwner}/${config.registryRepoName}.git`,
    });
  }

  if (config.githubToken) {
    endpoints.push({
      authMode: 'github-token',
      actual: buildAuthenticatedGithubUrl(config.registryRepoOwner, config.registryRepoName, config.githubToken),
      diagnostic: `https://x-access-token:***@github.com/${config.registryRepoOwner}/${config.registryRepoName}.git`,
    });
  }

  endpoints.push({
    authMode: 'public',
    actual: publicUrl,
    diagnostic: publicUrl,
  });

  return endpoints;
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
    const cloneEndpoints = buildCloneEndpoints(config);

    await mkdir(path.dirname(targetPath), { recursive: true });

    const alreadyCloned = await exists(targetPath);
    if (!alreadyCloned) {
      const cloneResult = await this.runGitCommandWithFallback(
        cloneEndpoints,
        (endpoint) => ['clone', '--depth', '1', '--branch', config.registryRepoRef, endpoint.actual, targetPath],
        (endpoint) => ['clone', '--depth', '1', '--branch', config.registryRepoRef, endpoint.diagnostic, targetPath],
        'clone',
      );
      if (!cloneResult.ok) {
        return cloneResult;
      }

      return ok(targetPath);
    }

    const fetchResult = await this.runGitCommandWithFallback(
      cloneEndpoints,
      (endpoint) => ['-C', targetPath, 'fetch', endpoint.actual, config.registryRepoRef, '--depth', '1'],
      (endpoint) => ['-C', targetPath, 'fetch', endpoint.diagnostic, config.registryRepoRef, '--depth', '1'],
      'fetch',
    );
    if (!fetchResult.ok) {
      return fetchResult;
    }

    const checkoutResult = await this.runGitCommand(['-C', targetPath, 'checkout', 'FETCH_HEAD']);
    if (!checkoutResult.ok) {
      return checkoutResult;
    }

    return ok(targetPath);
  }

  private async runGitCommand(
    args: readonly string[],
    diagnosticArgs: readonly string[] = args,
  ): Promise<Result<void>> {
    const commandResult = await this.runGitCommandRaw(args);
    if (commandResult.ok) {
      return ok(undefined);
    }

    return fail(
      createDiagnostic('GIT_COMMAND_FAILED', 'error', 'Git command failed while preparing registry source.', {
        args: diagnosticArgs,
        message: commandResult.message,
      }),
    );
  }

  private async runGitCommandWithFallback(
    endpoints: readonly CloneEndpoint[],
    buildActualArgs: (endpoint: CloneEndpoint) => readonly string[],
    buildDiagnosticArgs: (endpoint: CloneEndpoint) => readonly string[],
    operation: 'clone' | 'fetch',
  ): Promise<Result<void>> {
    const attempts: Array<Record<string, unknown>> = [];

    for (const endpoint of endpoints) {
      const actualArgs = buildActualArgs(endpoint);
      const diagnosticArgs = buildDiagnosticArgs(endpoint);
      const commandResult = await this.runGitCommandRaw(actualArgs);

      if (commandResult.ok) {
        return ok(undefined);
      }

      attempts.push({
        authMode: endpoint.authMode,
        args: diagnosticArgs,
        message: commandResult.message,
      });
    }

    return fail(
      createDiagnostic('GIT_COMMAND_FAILED', 'error', 'Git command failed while preparing registry source.', {
        operation,
        attempts,
        hint: 'Verify UAPKG_REGISTRY_REPO_TOKEN has read access to the target repository, including SSO authorization when required.',
      }),
    );
  }

  private async runGitCommandRaw(
    args: readonly string[],
  ): Promise<{ readonly ok: true } | { readonly ok: false; readonly message: string }> {
    try {
      await execFileAsync('git', [...args]);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, message };
    }
  }
}
