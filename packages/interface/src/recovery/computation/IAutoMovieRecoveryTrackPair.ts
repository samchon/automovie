import type { IAutoMovieRecoveryImageFeaturesMatchingOperation } from "../../index";

/** Frozen forward and reverse appearance matches for two input view indices. */
export interface IAutoMovieRecoveryTrackPair {
  /** First view's index in the fixed input population. */
  first: number;

  /** Second view's index in the same input population. */
  second: number;

  /** Borrowed query-first to target-second feature matches. */
  forward: ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>;

  /** Borrowed query-second to target-first feature matches. */
  reverse: ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>;
}
