import type { AutoMovieVector3Tuple } from "../../index";

/** Cubic endpoint data on its enclosing curve's positive phase interval.
 *
 * @evidence contracts/development/design.md#principled-representation Endpoint values and first derivatives uniquely determine a cubic on a supplied interval.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Named endpoint and derivative fields prevent tangent directions from replacing derivative magnitudes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled points, normalized tangent or inferred vertical width is stored.
 * @evidence contracts/development/common.md#meaningful-documentation Members state endpoint units and derivative chart.
 */
export interface IAutoMovieRecoveryHermiteSpan {
  /** Start position, millimetres in the original spatial frame. */
  start: Readonly<AutoMovieVector3Tuple>;

  /** End position, millimetres in the original spatial frame. */
  end: Readonly<AutoMovieVector3Tuple>;

  /** Start dP/ds, millimetres per enclosing phaseUnit. */
  startDerivative: Readonly<AutoMovieVector3Tuple>;

  /** End dP/ds, millimetres per enclosing phaseUnit. */
  endDerivative: Readonly<AutoMovieVector3Tuple>;
}
