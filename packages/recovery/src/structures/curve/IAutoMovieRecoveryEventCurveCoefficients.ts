import type { IAutoMovieCurve64 } from "@automovie/engine";

/**
 * Original millimetre cubic coefficients with an optional declared normalized partition.
 *
 * @evidence contracts/development/design.md#principled-representation Cubic controls and physical phase widths remain the engine record; optional knots retain the occurrence chart independently of spatial length.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named extension replaces an anonymous intersection at the public conversion boundary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Knots supply no fitted geometry, degree reduction or inferred correspondence.
 * @evidence contracts/development/common.md#meaningful-documentation Inherited coefficients retain millimetres and original phase units; the optional partition spans normalized zero to one.
 */
export interface IAutoMovieRecoveryEventCurveCoefficients
  extends IAutoMovieCurve64.Cubic {
  /** Optional exact normalized partition, including zero and one, without changing native widths. */
  canonicalKnots?: readonly number[];
}
