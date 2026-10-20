import type { IAutoMovieCurve64 } from "@automovie/engine/geometry/curve";

/**
 * Cubic endpoint data on its enclosing curve's positive phase interval.
 *
 * @evidence contracts/common.md#principled-implementation Endpoint values and first derivatives uniquely determine a cubic on a supplied interval.
 * @evidence contracts/common.md#clear-and-simple-design Named endpoint and derivative fields prevent tangent directions from replacing derivative magnitudes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled points, normalized tangent or inferred vertical width is stored.
 * @evidence contracts/common.md#meaningful-documentation Members state endpoint units and derivative chart.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The interface owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Coefficients belong to the enclosing artifact.
 */
export interface IAutoMovieRecoveryHermiteSpan {
  /** Start position, millimetres in the original spatial frame. */
  start: IAutoMovieCurve64.Vector;

  /** End position, millimetres in the original spatial frame. */
  end: IAutoMovieCurve64.Vector;

  /** Start dP/ds, millimetres per enclosing phaseUnit. */
  startDerivative: IAutoMovieCurve64.Vector;

  /** End dP/ds, millimetres per enclosing phaseUnit. */
  endDerivative: IAutoMovieCurve64.Vector;
}
