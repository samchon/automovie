/** Provenance of an unchanged original current-cycle point. */
export interface IAutoMovieRecoveryObservedPoint {
  /** The output point is one original current-cycle observation. */
  kind: "observed-point";

  /** Zero-based ordinal in the current input point array. */
  sourceIndex: number;
}
