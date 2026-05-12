import { describe, expect, it } from 'vitest';
import { MarkdownLinkRewriter } from '../src/infrastructure/MarkdownLinkRewriter.js';

describe('MarkdownLinkRewriter', () => {
  it('rewrites relative links and images to absolute GitHub URLs', () => {
    const rewriter = new MarkdownLinkRewriter();
    const markdown = '[Guide](./docs/setup.md)\n![Logo](./images/logo.png)';

    const result = rewriter.rewrite(markdown, 'https://github.com/uapkg/example', 'main');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toContain('[Guide](https://github.com/uapkg/example/blob/main/docs/setup.md)');
    expect(result.value).toContain('![Logo](https://raw.githubusercontent.com/uapkg/example/main/images/logo.png)');
  });
});
