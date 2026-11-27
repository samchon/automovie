import type { IAutoMovieCubicBezierCurve64 } from "./IAutoMovieCubicBezierCurve64";

/**
 * Borrowed cubic generating boundary and its declared signed winding at one
 * saved physical section. Preparation preserves the curve reference and
 * winding; later curve sampling owns geometric admission.
 */
export interface IAutoMoviePrepareContourDocument64Observation {
  /**
   * Original cubic boundary in the curve contract's millimetre frame; preserve
   * it throughout this loft invocation because preparation does not clone
   * coefficient storage.
   */
  curve: IAutoMovieCubicBezierCurve64;
  /**
   * Declared signed material winding copied from the section loop. Positive and
   * negative rings retain their distinct orientation through sampling and slab
   * incidence.
   */
  winding: number;
}
