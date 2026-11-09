/**
 * Represent admitted nonnegative metre and 0..180 degree tolerances.
 *
 * @evidence contracts/development/design.md#principled-representation Represent admitted nonnegative metre and 0..180 degree tolerances.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A shared type links tolerance admission and boundary comparison.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Values must be admitted by readContinuityTolerances rather than inferred from a numeric type.
 * @evidence contracts/development/common.md#meaningful-documentation Field units and inclusive ranges are documented.
 */
export interface IAutoMovieContinuityTolerances {
  /** Allowed nonnegative world-space position drift in metres. */
  position: number;

  /** Allowed facing drift in degrees, admitted within the inclusive range 0..180. */
  facingDeg: number;
}
