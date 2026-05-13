import { EnvConfigLoader } from '../config/EnvConfig.js';
import { BuildRegistrySiteDataUseCase } from '../application/BuildRegistrySiteDataUseCase.js';
import { ArtifactWriter } from '../infrastructure/ArtifactWriter.js';
import { ManifestScanner } from '../infrastructure/ManifestScanner.js';
import { ManifestValidator } from '../infrastructure/ManifestValidator.js';
import { MarkdownLinkRewriter } from '../infrastructure/MarkdownLinkRewriter.js';
import { MarkdownSanitizer } from '../infrastructure/MarkdownSanitizer.js';
import { ReadmeFetcher } from '../infrastructure/ReadmeFetcher.js';
import { RegistrySourceClient } from '../infrastructure/RegistrySourceClient.js';

const loadLocalEnvFiles = (): void => {
  // Node >=22 supports process.loadEnvFile, allowing a cross-platform .env workflow with no shell export/set.
  for (const fileName of ['.env', '.env.local']) {
    try {
      process.loadEnvFile(fileName);
    } catch {
      // Missing files are expected for some environments.
    }
  }
};

const logDiagnostics = (
  diagnostics: readonly { code: string; severity: string; message: string; data?: Record<string, unknown> }[],
): void => {
  for (const diagnostic of diagnostics) {
    const suffix = diagnostic.data ? ` ${JSON.stringify(diagnostic.data)}` : '';
    console.log(`[${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}${suffix}`);
  }
};

async function main(): Promise<void> {
  loadLocalEnvFiles();

  const configLoader = new EnvConfigLoader();
  const configResult = configLoader.loadFromProcessEnv();

  if (!configResult.ok) {
    logDiagnostics(configResult.diagnostics);
    process.exitCode = 1;
    return;
  }

  const useCase = new BuildRegistrySiteDataUseCase(
    new RegistrySourceClient(),
    new ManifestScanner(),
    new ManifestValidator(),
    new ReadmeFetcher(configResult.value.githubToken),
    new MarkdownLinkRewriter(),
    new MarkdownSanitizer(),
    new ArtifactWriter(),
  );

  const result = await useCase.run(configResult.value);
  if (!result.ok) {
    logDiagnostics(result.diagnostics);
    process.exitCode = 1;
    return;
  }

  logDiagnostics(result.diagnostics);
  console.log(`Generated ${result.value.packageCount} package artifacts in ${result.value.outputDir}`);
}

void main();
