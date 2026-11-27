import type { IAutoMovieCubicBezierCurve64 } from "../geometry/IAutoMovieCubicBezierCurve64";
import type { IAutoMovieRecoveryHermiteSpan } from "..";

/**
 * Piecewise cubic Hermite coefficients retaining original identity and phase
 * widths.
 */
export interface IAutoMovieRecoveryHermiteCurve extends Omit<
  IAutoMovieCubicBezierCurve64,
  "type" | "spans"
> {
  /** Selects endpoint values and derivatives rather than Bernstein handles. */
  type: "cubicHermite";

  /** One endpoint record per original phase interval, in the original direction. */
  spans: readonly IAutoMovieRecoveryHermiteSpan[];
}
