import type { IAutoMovieCubicBezierCurve64 } from "../../geometry/curve/IAutoMovieCubicBezierCurve64";

/**
 * A named replacement cubic and its separate numerical observation-fit
 * estimate.
 */

export interface IAutoMovieRecoveryCurveOverride {
  /**
   * Finite continuous millimetre cubic retaining its original closure and
   * phase.
   */
  curve: IAutoMovieCubicBezierCurve64;

  /** Nonnegative numerical PL-data upper estimate in millimetres. */
  dataUpperEstimateMm: number;
}
