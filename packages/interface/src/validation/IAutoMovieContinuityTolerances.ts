/** Represent admitted nonnegative metre and 0..180 degree tolerances. */
export interface IAutoMovieContinuityTolerances {
  /** Allowed nonnegative world-space position drift in metres. */
  position: number;

  /**
   * Allowed facing drift in degrees, admitted within the inclusive range
   * 0..180.
   */
  facingDeg: number;
}
