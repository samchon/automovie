/**
 * A closed `[min, max]` interval of allowed rotation about one anatomical axis,
 * in degrees.
 *
 * The ROM validator compares a supplied joint angle with these declared
 * inclusive bounds and reports an overshoot. Engine defaults draw on goniometry
 * norms and rigs may override them; satisfying an interval alone is not proof
 * of complete physical or anatomical possibility.
 *
 * Sign convention is per-axis and documented on
 * {@link IAutoMovieJointConstraint}. `min <= max` is required; the engine treats
 * `min > max` as a malformed constraint.
 */
export interface IAutoMovieAngleRange {
  /** Lower bound, degrees (inclusive). */
  min: number;

  /** Upper bound, degrees (inclusive). */
  max: number;
}
