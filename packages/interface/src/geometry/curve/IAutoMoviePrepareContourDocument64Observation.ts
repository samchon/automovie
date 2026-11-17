import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

/**
 * Borrowed cubic generating boundary and its declared signed winding at one saved
 * physical section. Preparation preserves the curve reference and winding; later
 * curve sampling owns geometric admission.
 *
 * @evidence contracts/development/design.md#principled-representation The canonical cubic contract owns millimetre positions and phase units while winding records authored material-boundary orientation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareAutoMovieContourDocument64 creates this small view for later ring sampling without copying the generating curve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Preparation does not infer winding from sampled area or replace an invalid curve; sampling records a local refusal.
 * @evidence contracts/development/common.md#meaningful-documentation States borrowed coefficient lifetime and the later admission owner.
 */
export interface IAutoMoviePrepareContourDocument64Observation {
  /** Original cubic boundary in the curve contract's millimetre frame; preserve it throughout this loft invocation because preparation does not clone coefficient storage. */
  curve: IAutoMovieCurve64.Cubic;
  /** Declared signed material winding copied from the section loop. Positive and negative rings retain their distinct orientation through sampling and slab incidence. */
  winding: number;
}
