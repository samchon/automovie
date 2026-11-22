/**
 * An intentional lateral shift from a standing pose on two ground plants.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents distance, frame and phase durations.
 * @evidence contracts/development/design.md#principled-representation A signed lateral distance with separate shift, hold and optional return times.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This contract is the input to shiftStandingWeight, which admits the request against the entry stance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The distance specifies pelvis displacement. No force or center-of-pressure target is inferred.
 */
export interface IAutoMovieMotionHumanShiftStandingWeight {
  /** Nonzero finite lateral pelvis displacement in metres. Positive moves toward the performer's left. */
  by: number;

  /** Positive shift duration in seconds. Default 0.8 s. */
  duration?: number;

  /** Nonnegative time to hold the shifted pose in seconds. Default 0 s. */
  hold?: number;

  /** Positive time to return to the starting pose in seconds. Omit to finish shifted. */
  returnSeconds?: number;
}
