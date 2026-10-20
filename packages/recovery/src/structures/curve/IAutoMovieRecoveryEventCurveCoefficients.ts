import type { IAutoMovieCurve64 } from "@automovie/engine/geometry/curve";

/**
 * Original millimetre cubic coefficients with an optional declared normalized partition.
 *
 * @evidence contracts/common.md#principled-implementation Cubic controls and physical phase widths remain the engine record; optional knots retain the occurrence chart independently of spatial length.
 * @evidence contracts/common.md#clear-and-simple-design One named extension replaces an anonymous intersection at the public conversion boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Knots supply no fitted geometry, degree reduction or inferred correspondence.
 * @evidence contracts/common.md#meaningful-documentation Inherited coefficients retain millimetres and original phase units; the optional partition spans normalized zero to one.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no conversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns all coefficient and knot arrays.
 */
export interface IAutoMovieRecoveryEventCurveCoefficients
  extends IAutoMovieCurve64.Cubic {
  /** Optional exact normalized partition, including zero and one, without changing native widths. */
  canonicalKnots?: readonly number[];
}
