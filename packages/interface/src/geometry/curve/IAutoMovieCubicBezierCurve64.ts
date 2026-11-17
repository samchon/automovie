import type { AutoMovieCubicBezierControls3 } from "./AutoMovieCubicBezierControls3";

/**
 * Piecewise cubic position coefficients in millimetres, with positive piece widths in one declared phase chart. Closure is declared metadata; continuity and regularity need separate checks.
 *
 * @evidence contracts/development/design.md#principled-representation Spans and phase widths retain the original generating coefficients and derivative scale.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Position, topology and phase partition travel together so an evaluator need not infer a chart.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled display network or implicit equal-width partition substitutes for the supplied spans.
 * @evidence contracts/development/common.md#meaningful-documentation Properties distinguish millimetre positions, phase units and closure claims.
 */
export interface IAutoMovieCubicBezierCurve64 {
  /** Closed representation tag selecting the actual coefficient evaluator and its units. */
  type: "cubicBezier";

  /** Stable semantic course identifier carried into actual inspection and source attribution. */
  name: string;

  /** Declared closure topology; this flag alone is not a periodicity, regularity or nonintersection proof. */
  closed: boolean;

  /** Explicit spatial unit of the generated primitive; exact coordinates remain millimetres until display conversion. */
  unit: "mm";

  /** Unit of the independent curve parameter; interval widths and reported derivatives use this same chart. */
  phaseUnit: "turn" | "mm" | "normalized";

  /** Ordered positive widths of every actual piece; cumulative values retain the parameter chart for derivatives and joins. */
  phaseIntervals: readonly number[];

  /** Ordered cubic Bernstein P0 through P3 coefficients; handles are not through-points or Catmull-Rom waypoints. */
  spans: readonly AutoMovieCubicBezierControls3[];
}
