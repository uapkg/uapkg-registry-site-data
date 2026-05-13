export interface PackageVersionDependencyArtifact {
  readonly version: string;
  readonly registry?: string;
}

export type PackageVersionDependencyMapArtifact = Readonly<Record<string, PackageVersionDependencyArtifact>>;

export interface PackageVersionArtifact {
  readonly version: string;
  readonly publishedAt?: number;
  readonly dependencyCount: number;
  readonly gitTree: string;
  readonly packageFileUrl: string;
  readonly dependencies: PackageVersionDependencyMapArtifact;
  readonly devDependencies: PackageVersionDependencyMapArtifact;
  readonly peerDependencies: PackageVersionDependencyMapArtifact;
}

export interface PackageSearchMetaArtifact {
  readonly title: string;
  readonly packageName: string;
  readonly sourceUrl: string;
  readonly latestVersion?: string;
  readonly versionCount: number;
  readonly dependencyCountTotal: number;
}

export interface PackageSummaryArtifact {
  readonly name: string;
  readonly sourceUrl: string;
  readonly latestVersion?: string;
  readonly versionCount: number;
  readonly updatedAt?: number;
  readonly searchMeta: PackageSearchMetaArtifact;
}

export interface PackageDetailArtifact extends PackageSummaryArtifact {
  readonly versions: readonly PackageVersionArtifact[];
  readonly readmeHtml?: string;
}

export interface PackageIndexArtifact {
  readonly generatedAt: string;
  readonly packages: readonly PackageSummaryArtifact[];
}
