import type { IAutoMovieViewConic } from "./IAutoMovieViewConic";

/**
 * Data and callback contracts shared by the LoftPhaseSource operations.
 *
 * @evidence contracts/development/design.md#principled-representation Source coordinates retain station-mm, signed-root or radian units; cardinal derivative rows and station weights remain in that chosen coordinate until explicitly transformed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface LoftPhaseSource prepares these native curve combinations for phase evaluation and chain source interpolation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Array order and dimensions are preparation premises; a weighted native family is not a fit of display samples.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes source-coordinate derivatives from a physical station change.
 */
export namespace IAutoMovieLoftPhaseSource {
  /**
   * Explicit native functions and their natural-coordinate cardinal jets.
   *
   * @evidence contracts/development/design.md#principled-representation Native curve records own geometry while cardinal derivative tables depend only on increasing interpolation coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Coordinates, native curves and two derivative tables completely describe the candidate without identity registration.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Equal-value structured/JSON copies preserve geometry; inputs and prepared records must remain immutable after preparation.
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its coordinate, physical length or derivative meaning.
   */
  export interface ISource {
    /** Increasing coordinates q: station mm, signed sqrt(mm), or radians as chosen by the caller. */
    coordinates: readonly number[];

    /** Native sections in the same order, with millimetre radii and polar-radian phase. */
    curves: readonly IAutoMovieViewConic.ICurve[];

    /** Cardinal first derivatives in q at every source coordinate. */
    slopes: readonly (readonly number[])[];

    /** Cardinal second derivatives in q at the same coordinates. */
    curvatures: readonly (readonly number[])[];
  }

  /**
   * One station's explicit linear combinations of native source functions.
   *
   * @evidence contracts/development/design.md#principled-representation Three weight rows evaluate value and first/second chosen-coordinate derivatives of the same interpolant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One source reference and three numeric rows separate reusable station preparation from phase evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A supplied finite change of coordinate reexpresses both derivative orders; no finite singular-pole derivative is fabricated.
   * @evidence contracts/development/common.md#meaningful-documentation Rows specify derivative order and source/physical-coordinate units.
   */
  export interface IStation {
    /** Explicit immutable native source. */
    source: IAutoMovieLoftPhaseSource.ISource;

    /** Value, first and second derivative weights, in q unless station supplied a physical change of coordinate. */
    weights: readonly (readonly number[])[];
  }
}
