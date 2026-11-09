import type { IAutoMovieCurve64 } from "@automovie/engine";

import type { IAutoMovieRecoveryHermiteSpan } from "./IAutoMovieRecoveryHermiteSpan";

/**
 * Piecewise cubic Hermite coefficients retaining original identity and phase widths.
 *
 * @evidence contracts/development/design.md#principled-representation Each span retains endpoint positions and derivatives with respect to its original independent parameter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shared cubic metadata has one owner; the discriminant and span basis alone change.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Conversion does not change closure, direction, spatial units or parameter intervals.
 * @evidence contracts/development/common.md#meaningful-documentation States coefficient units and inherited identity and phase metadata.
 */
export interface IAutoMovieRecoveryHermiteCurve extends Omit<
  IAutoMovieCurve64.Cubic,
  "type" | "spans"
> {
  /** Selects endpoint values and derivatives rather than Bernstein handles. */
  type: "cubicHermite";

  /** One endpoint record per original phase interval, in the original direction. */
  spans: readonly IAutoMovieRecoveryHermiteSpan[];
}
