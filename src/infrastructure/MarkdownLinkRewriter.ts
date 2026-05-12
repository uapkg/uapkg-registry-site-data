import path from 'node:path';
import { createDiagnostic } from '../core/Diagnostic.js';
import { fail, ok, type Result } from '../core/Result.js';
import type { IMarkdownLinkRewriter } from '../contracts/Services.js';

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

const isRelativeReference = (value: string): boolean => {
  if (value.startsWith('#')) return false;
  if (value.startsWith('//')) return false;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) return false;
  return true;
};

const normalizeRelative = (value: string): string => {
  const withoutHash = value.split('#')[0];
  const normalized = path.posix.normalize(withoutHash);
  return normalized.replace(/^\.\//, '');
};

export class MarkdownLinkRewriter implements IMarkdownLinkRewriter {
  public rewrite(markdown: string, sourceRepoUrl: string, branch: string): Result<string> {
    const coordinates = parseGitHubCoordinates(sourceRepoUrl);
    if (!coordinates) {
      return fail(
        createDiagnostic(
          'README_REWRITE_UNSUPPORTED_SOURCE',
          'warning',
          'Cannot rewrite links for unsupported source URL.',
          {
            sourceRepoUrl,
          },
        ),
      );
    }

    const linkBase = `https://github.com/${coordinates.owner}/${coordinates.repo}/blob/${branch}`;
    const imageBase = `https://raw.githubusercontent.com/${coordinates.owner}/${coordinates.repo}/${branch}`;

    let output = markdown;

    output = output.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, target) => {
      const trimmed = String(target).trim();
      if (!isRelativeReference(trimmed)) {
        return `![${alt}](${trimmed})`;
      }

      const resolvedPath = normalizeRelative(trimmed);
      return `![${alt}](${imageBase}/${resolvedPath})`;
    });

    output = output.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (fullMatch, text, target, offset, content) => {
      if (offset > 0 && content[offset - 1] === '!') {
        return fullMatch;
      }

      const trimmed = String(target).trim();
      if (!isRelativeReference(trimmed)) {
        return `[${text}](${trimmed})`;
      }

      const resolvedPath = normalizeRelative(trimmed);
      return `[${text}](${linkBase}/${resolvedPath})`;
    });

    return ok(output);
  }
}
