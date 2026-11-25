/** An intentional lateral shift from a standing pose on two ground plants. */
export interface IAutoMovieMotionHumanShiftStandingWeight {
  /**
   * Nonzero finite lateral pelvis displacement in metres. Positive moves toward
   * the performer's left.
   */
  by: number;

  /** Positive shift duration in seconds. Default 0.8 s. */
  duration?: number;

  /** Nonnegative time to hold the shifted pose in seconds. Default 0 s. */
  hold?: number;

  /**
   * Positive time to return to the starting pose in seconds. Omit to finish
   * shifted.
   */
  returnSeconds?: number;
}
