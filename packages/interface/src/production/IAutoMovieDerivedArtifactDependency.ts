import type { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * One exact file consumed by a deterministic precomputation.
 *
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactDependency {
  /** Canonical project-relative input path. */
  path: string;

  /** SHA-256 of the exact input bytes. */
  digest: AutoMovieContentDigest;
}
