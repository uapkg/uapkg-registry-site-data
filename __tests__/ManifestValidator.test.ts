import { describe, expect, it } from 'vitest';
import { ManifestValidator } from '../src/infrastructure/ManifestValidator.js';

describe('ManifestValidator', () => {
  it('accepts valid manifest shape', () => {
    const validator = new ManifestValidator();
    const result = validator.validateManifest(
      {
        name: 'auth-sdk',
        packageSource: {
          type: 'git',
          url: 'https://github.com/uapkg/auth-sdk',
        },
        versions: {
          '0.3.0': {
            gitTree: '7777777777777777777777777777777777777777',
            meta: {
              publishedAt: 1748736000,
            },
            releaseFiles: {
              package: {
                url: 'https://github.com/uapkg/registry-testing/releases/download/auth-sdk-v0.3.0/auth-sdk-0.3.0.tgz',
                integrity: {
                  hash: 'sha256:1212121212121212121212121212121212121212121212121212121212121212',
                  size: 17540,
                },
              },
            },
            dependencies: {
              'http-client': '^1.0.0',
              'core-utils': {
                version: '^1.1.0',
                registry: 'default',
              },
            },
            peerDependencies: {
              'logging-kit': '^1.0.0',
            },
          },
        },
      },
      'packages/a/auth-sdk.json',
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
