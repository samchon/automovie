import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/** One asset the drawn frame depends on. */
export interface IAutoMovieRenderTargetAsset {
  /** Canonical project-relative path. */
  path: string;

  /** SHA-256 of the exact bytes the frame will read. */
  digest: AutoMovieContentDigest;
}
