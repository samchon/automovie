/** Qualified adjacent open-arc transport in saved report coordinates. */
export interface IAutoMovieRecoveryOpenCurvePair {
  /** Saved open-curve ordinal on the earlier cut. */
  before: number;

  /** Saved open-curve ordinal on the later cut. */
  after: number;

  /**
   * Whether the later curve's endpoint order is reversed relative to the
   * earlier curve.
   */
  reverseAfter: boolean;
}
