import { createDiagnostic } from '../core/Diagnostic.js';
import { fail, ok, type Result } from '../core/Result.js';
import type { IReadmeFetcher } from '../contracts/Services.js';

interface GitHubCoordinates {
  readonly owner: string;
  readonly repo: string;
}

const parseGitHubCoordinates = (sourceRepoUrl: string): GitHubCoordinates | undefined => {
  const httpsMatch = sourceRepoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
  if (httpsMatch) {
    return {
      owner: httpsMatch[1],
      repo: httpsMatch[2],
    };
  }

  const sshMatch = sourceRepoUrl.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (sshMatch) {
    return {
      owner: sshMatch[1],
      repo: sshMatch[2],
    };
  }

  return undefined;
};

export class ReadmeFetcher implements IReadmeFetcher {
  constructor(private readonly githubToken?: string) {}

  public async fetchReadmeMarkdown(sourceRepoUrl: string, branch: string): Promise<Result<string | undefined>> {
    const coordinates = parseGitHubCoordinates(sourceRepoUrl);
    if (!coordinates) {
      return fail(
        createDiagnostic('README_SOURCE_UNSUPPORTED', 'warning', 'Package source is not a supported GitHub URL.', {
          sourceRepoUrl,
        }),
      );
    }

    const candidates = ['README.md', 'README.MD', 'readme.md'];
    for (const candidate of candidates) {
      const rawUrl = `https://raw.githubusercontent.com/${coordinates.owner}/${coordinates.repo}/${branch}/${candidate}`;
      const response = await fetch(rawUrl, {
        headers: this.githubToken ? { Authorization: `Bearer ${this.githubToken}` } : undefined,
      });

      if (response.status === 404) {
        continue;
      }

      if (!response.ok) {
        return fail(
          createDiagnostic(
            'README_FETCH_FAILED',
            'warning',
            'Failed to download README content from source repository.',
            {
              sourceRepoUrl,
              status: response.status,
            },
          ),
        );
      }

      const markdown = await response.text();
      return ok(markdown);
    }

    return ok(undefined, [
      createDiagnostic('README_NOT_FOUND', 'warning', 'No README was found in the source repository default branch.', {
        sourceRepoUrl,
      }),
    ]);
  }
}
