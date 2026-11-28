import type { IAutoMovieBernsteinCurvePiece64 } from "./IAutoMovieBernsteinCurvePiece64";

/**
 * Piecewise Bernstein geometry in millimetres with one declared phase chart.
 * Each piece retains its own degree and coefficient representation. The
 * enclosing chart assigns one positive width to each piece.
 */
export interface IAutoMovieBernsteinCurve64 {
  /**
   * Closed representation tag selecting the actual coefficient evaluator and
   * its units.
   */
  type: "bernstein";

  /** Nonblank course identity used in source attribution and inspection. */
  name: string;

  /**
   * Authored closure flag. Establish continuity, periodicity and regularity
   * when the consuming operation requires them.
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
   * One positive finite width per piece, in order. Cumulative values must
   * increase in binary64 and set the phase locations of joins.
   */
  phaseIntervals: readonly number[];

  /** Actual pieces retain their independent degree and denominator authority. */
  pieces: readonly IAutoMovieBernsteinCurvePiece64[];
}
