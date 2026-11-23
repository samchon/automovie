/** One canonical project-relative member of an imported model digest closure. */
export interface IAutoMovieImportedModelAsset {
  /** Canonical project-relative path. */
  path: string;

  /** SHA-256 sealed by the builder. */
  digest: string;
}
