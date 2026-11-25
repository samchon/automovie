/** An admitted open-curve correspondence across two adjacent saved sections. */
export interface IAutoMovieRecoveryOpenCurvePair {
  /** Open-curve ordinal in the preceding section report. */
  before: number;

  /** Open-curve ordinal in the following section report. */
  after: number;

  /**
   * Whether the following curve must be reversed relative to its saved
   * direction.
   */
  reverseAfter: boolean;
}
