import { describe, expect, it } from 'vitest';
import { ManifestValidator } from '../src/infrastructure/ManifestValidator.js';

describe('ManifestValidator', () => {
  it('accepts valid manifest shape', () => {
    const validator = new ManifestValidator();
    const result = validator.validateManifest(
      {
        name: 'demo-package',
        packageSource: {
          type: 'git',
          url: 'https://github.com/uapkg/demo',
        },
        versions: {
          '1.0.0': {
            gitTree: 'abc123',
            releaseFiles: {
              package: {
                url: 'https://example.com/pkg.tgz',
                integrity: {
                  hash: 'sha256:abcd',
                  size: 42,
                },
              },
            },
          },
        },
      },
      'packages/d/demo-package.json',
    );

    expect(result.ok).toBe(true);
  });

  it('rejects invalid manifest shape', () => {
    const validator = new ManifestValidator();
    const result = validator.validateManifest(
      {
        name: '',
        packageSource: {
          type: 'git',
          url: 'not-a-url',
        },
        versions: {},
      },
      'packages/d/demo-package.json',
    );

    expect(result.ok).toBe(false);
  });
});
