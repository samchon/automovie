import type {
  IAutoMovieRecoveryArtifactCoverage,
  IAutoMovieRecoveryMetadata,
} from "..";

/** Current generated recovery artifact with explicit coverage observations. */

export interface IAutoMovieRecoveryArtifact extends IAutoMovieRecoveryMetadata {
  /** Separate processing and retained-domain qualifications. */
  coverage: IAutoMovieRecoveryArtifactCoverage;
}
