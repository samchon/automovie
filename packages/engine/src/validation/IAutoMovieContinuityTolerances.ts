/**
 * Represent admitted nonnegative metre and 0..180 degree tolerances.
 *
 * @evidence contracts/common.md#principled-implementation Represent admitted nonnegative metre and 0..180 degree tolerances.
 * @evidence contracts/common.md#clear-and-simple-design A shared type links tolerance admission and boundary comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values must be admitted by readContinuityTolerances rather than inferred from a numeric type.
 * @evidence contracts/common.md#meaningful-documentation Field units and inclusive ranges are documented.
 * @evidence contracts/performance.md#efficient-algorithms Two scalar fields have constant storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Pairwise and film consumers share the same admitted representation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the small record, with no snapshot or host handle retained.
 * @author Samchon
 */
export interface IAutoMovieContinuityTolerances {
  /** Allowed nonnegative world-space position drift in metres. */
  position: number;

  /** Allowed facing drift in degrees, admitted within the inclusive range 0..180. */
  facingDeg: number;
}
