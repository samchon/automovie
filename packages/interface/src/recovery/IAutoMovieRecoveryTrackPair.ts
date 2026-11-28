import type { IAutoMovieRecoveryImageFeaturesMatchingOperation } from "..";

/**
 * Search results for one ordered source pair, with independently qualified
 * forward and reverse matches.
 */
export interface IAutoMovieRecoveryTrackPair {
  /** Original source index of the first view in the pair. */
  first: number;

  /** Original source index of the second view in the pair. */
  second: number;

  /** Directed matches using the first source as query and the second as target. */
  forward: ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>;

  /** Directed matches using the second source as query and the first as target. */
  reverse: ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>;
}
