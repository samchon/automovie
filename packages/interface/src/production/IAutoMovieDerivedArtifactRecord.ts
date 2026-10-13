import type { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { AutoMovieDerivedArtifactEncoding } from "./AutoMovieDerivedArtifactEncoding";
import { IAutoMovieDerivedArtifactDependency } from "./IAutoMovieDerivedArtifactDependency";

/**
 * Tracked identity of one explicitly generated deterministic artifact.
 *
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactRecord {
  /** Canonical output path below `automovie/derived/`. */
  path: string;

  /** Source-context representation of the exact output bytes. */
  encoding: AutoMovieDerivedArtifactEncoding;

  /** Generator source identity and normalized-source digest. */
  generator: IAutoMovieDerivedArtifactDependency;

  /** Declared input files sorted by canonical path. */
  inputs: IAutoMovieDerivedArtifactDependency[];

  /** Domain-separated digest of generator and declared input identities. */
  basisDigest: AutoMovieContentDigest;

  /** SHA-256 of the exact artifact bytes. */
  outputDigest: AutoMovieContentDigest;
}
