import type { IAutoMovieCubicBezierCurve64 } from "../geometry/IAutoMovieCubicBezierCurve64";

/**
 * Original millimetre cubic coefficients with an optional declared normalized
 * partition.
 */
export interface IAutoMovieRecoveryEventCurveCoefficients extends IAutoMovieCubicBezierCurve64 {
  /**
   * Optional exact normalized partition, including zero and one, without
   * changing native widths.
   */
  canonicalKnots?: readonly number[];
}
