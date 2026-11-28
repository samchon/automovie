import type { IAutoMovieCubicBezierCurve64 } from "./IAutoMovieCubicBezierCurve64";

/**
 * One borrowed cubic boundary and its authored winding at a saved section.
 * Sampling owns geometric qualification after document preparation.
 */
export interface IAutoMoviePrepareContourDocument64Observation {
  /**
   * Original cubic boundary in millimetres. Keep its coefficient storage stable
   * through sampling.
   */
  curve: IAutoMovieCubicBezierCurve64;
  /**
   * Declared signed material winding copied from the section loop. Positive and
   * negative rings retain their distinct orientation through sampling and slab
   * incidence.
   */
  winding: number;
}
