import type {
  IAutoMovieRecoveryCompletion,
  IAutoMovieRecoveryMetadata,
} from "..";

/**
 * Published coverage observations and caller-owned additional qualification
 * fields.
 */

export interface IAutoMovieRecoveryArtifactCoverage
  extends IAutoMovieRecoveryCompletion, IAutoMovieRecoveryMetadata {}
