import type { IAutoMovieHumanBindingLips } from "./IAutoMovieHumanBindingLips";
import type { IAutoMovieHumanChainRings } from "./IAutoMovieHumanChainRings";
import type { IAutoMovieHumanJointCentres } from "./IAutoMovieHumanJointCentres";
import type { IAutoMovieHumanNeutral } from "./IAutoMovieHumanNeutral";

/**
 * Type contracts exchanged by AutoMovieHumanBindingInputs; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanBindingInputs exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IInputs. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanBindingInputs; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IInputs contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanBindingInputs {
  /** A body's binding inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A body's binding inputs.
   * @evidence contracts/development/design.md#principled-representation `scale`: Metres per calibration millimetre. `stature`: The calibration's stature, millimetres; the pose evaluator's scale reads it. `joints`: The bind skeleton, calibration millimetres, parent before child.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBindingInputs.derive. Read by AutoMovieHumanBindingInputs.samples.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `scale`, `stature`, `joints`, `rings`, `neutral`, `turns`, `crotch`, `lips`; callers supply the complete record.
   */
  export interface IInputs {
    /** Metres per calibration millimetre. */
    scale: number;

    /** The calibration's stature, millimetres; the pose evaluator's scale reads it. */
    stature: number;

    /** The bind skeleton, calibration millimetres, parent before child. */
    joints: IAutoMovieHumanJointCentres.IJoint[];

    /** The skin of every chain, sampled at {@link PHASES} phases per ring. */
    rings: IAutoMovieHumanChainRings[];

    /** The anatomical neutral reached from the bind. */
    neutral: IAutoMovieHumanNeutral.IOutput;

    /** Each joint's largest turn from its parent over its pose channels, radians. */
    turns: Map<string, number>;

    /** The crotch's height, metres; infinity for a trunk without a midline. */
    crotch: number;

    /** The lips' contact line, or null for a mouth whose skin is not open. */
    lips: IAutoMovieHumanBindingLips | null;
  }
}
