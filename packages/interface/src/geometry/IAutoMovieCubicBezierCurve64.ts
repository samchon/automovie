import type { AutoMovieCubicBezierControls3 } from "./AutoMovieCubicBezierControls3";

/**
 * Piecewise cubic position coefficients in millimetres, with positive piece
 * widths in one declared phase chart. Closure is declared metadata; continuity
 * and regularity need separate checks.
 */
export interface IAutoMovieCubicBezierCurve64 {
  /**
   * Closed representation tag selecting the actual coefficient evaluator and
   * its units.
   */
  type: "cubicBezier";

  /**
   * Stable semantic course identifier carried into actual inspection and source
   * attribution.
   */
  name: string;

  /**
   * Declared closure topology; this flag alone is not a periodicity, regularity
   * or nonintersection proof.
   */
  closed: boolean;

  /**
   * Explicit spatial unit of the generated primitive; exact coordinates remain
   * millimetres until display conversion.
   */
  unit: "mm";

  /**
   * Unit of the independent curve parameter; interval widths and reported
   * derivatives use this same chart.
   */
  phaseUnit: "turn" | "mm" | "normalized";

  /**
   * Ordered positive widths of every actual piece; cumulative values retain the
   * parameter chart for derivatives and joins.
   */
  phaseIntervals: readonly number[];

  /**
   * Ordered cubic Bernstein P0 through P3 coefficients; handles are not
   * through-points or Catmull-Rom waypoints.
   */
  spans: readonly AutoMovieCubicBezierControls3[];
}
