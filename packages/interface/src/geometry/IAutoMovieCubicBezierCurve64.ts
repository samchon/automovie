import type { AutoMovieCubicBezierControls3 } from "./AutoMovieCubicBezierControls3";

/**
 * Cubic Bézier spans in millimetres, ordered in one declared phase chart. Each
 * span has one positive width. The closure flag records authored intent;
 * continuity and regularity require their own checks.
 */
export interface IAutoMovieCubicBezierCurve64 {
  /**
   * Closed representation tag selecting the actual coefficient evaluator and
   * its units.
   */
  type: "cubicBezier";

  /** Nonblank course identity used in source attribution and inspection. */
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
   * One positive finite width per span. Their finite cumulative sums must
   * increase strictly in binary64 and address successive seams.
   */
  phaseIntervals: readonly number[];

  /** Four ordered XYZ Bernstein coefficients, P0 through P3, for each span. */
  spans: readonly AutoMovieCubicBezierControls3[];
}
