import type { IAutoMovieCurve64 } from "@automovie/engine/geometry/curve";

import type { IAutoMovieRecoveryHermiteSpan } from "./IAutoMovieRecoveryHermiteSpan";

/**
 * Piecewise cubic Hermite coefficients retaining original identity and phase widths.
 *
 * @evidence contracts/common.md#principled-implementation Each span retains endpoint positions and derivatives with respect to its original independent parameter.
 * @evidence contracts/common.md#clear-and-simple-design Shared cubic metadata has one owner; the discriminant and span basis alone change.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conversion does not change closure, direction, spatial units or parameter intervals.
 * @evidence contracts/common.md#meaningful-documentation States coefficient units and inherited identity and phase metadata.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no conversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the saved spans.
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
