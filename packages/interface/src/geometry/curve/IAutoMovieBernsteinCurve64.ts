import type { IAutoMovieBernsteinCurvePiece64 } from "./IAutoMovieBernsteinCurvePiece64";

/**
 * Piecewise Bernstein positions in millimetres, preserving each piece degree
 * and the enclosing positive-width phase partition.
 */
export interface IAutoMovieBernsteinCurve64 {
  /**
   * Closed representation tag selecting the actual coefficient evaluator and
   * its units.
   */
  type: "bernstein";

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

  /** Actual pieces retain their independent degree and denominator authority. */
  pieces: readonly IAutoMovieBernsteinCurvePiece64[];
}
