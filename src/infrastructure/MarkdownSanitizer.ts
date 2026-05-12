import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { createDiagnostic } from '../core/Diagnostic.js';
import { fail, ok, type Result } from '../core/Result.js';
import type { IMarkdownSanitizer } from '../contracts/Services.js';

export class MarkdownSanitizer implements IMarkdownSanitizer {
  private readonly markdownRenderer: MarkdownIt;

  constructor() {
    this.markdownRenderer = new MarkdownIt({
      html: false,
      linkify: true,
      typographer: true,
    });
  }

  public renderSafeHtml(markdown: string): Result<string> {
    try {
      const renderedHtml = this.markdownRenderer.render(markdown);
      const safeHtml = sanitizeHtml(renderedHtml, {
        allowedTags: [
          'a',
          'p',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'ul',
          'ol',
          'li',
          'em',
          'strong',
          'blockquote',
          'code',
          'pre',
          'hr',
          'img',
          'table',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
        ],
        allowedAttributes: {
          a: ['href', 'title', 'target', 'rel'],
          img: ['src', 'alt', 'title'],
          th: ['align'],
          td: ['align'],
          code: ['class'],
          pre: ['class'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        allowProtocolRelative: false,
        transformTags: {
          a: sanitizeHtml.simpleTransform('a', {
            rel: 'noopener noreferrer',
            target: '_blank',
          }),
        },
      });

      return ok(safeHtml);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail(
        createDiagnostic('README_SANITIZE_FAILED', 'error', 'Failed to sanitize rendered README markdown.', {
          message,
        }),
      );
    }
  }
}
