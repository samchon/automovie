import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanMassSource } from "../limb/IAutoMovieHumanMassSource";
import type { IAutoMovieHumanGlutealParent } from "./IAutoMovieHumanGlutealParent";

/**
 * Original trunk and breast dimensions with the admitted parent source and numerical root-support metadata. Runtime construction and admission remain with AutoMovieHumanBreastConnection in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes original trunk and breast dimensions with the admitted parent source and numerical root-support metadata; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Original trunk and breast dimensions with the admitted parent source and numerical root-support metadata. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanBreastConnection; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing BreastConnection contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanBreastConnection {
  /** Same generating trunk and the mass's independent sourced dimensions.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Same generating trunk and the mass's independent sourced dimensions.
   * @evidence contracts/development/design.md#principled-representation `trunk`: Actual current tape-pass original trunk. `target`: Public AP apex in calibration mm. `footprint`: Own up/lateral/down/medial footprint, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanBreastConnection.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `trunk`, `target`, `footprint`, `shoulder`, `lateral`; callers supply the complete record.
   */
  export interface IInput {
    /** Actual current tape-pass original trunk. */
    trunk: IAutoMovieViewPart;
    /** Public AP apex in calibration mm. */
    target: AutoMovieVector3Tuple;
    /** Own up/lateral/down/medial footprint, mm. */
    footprint: [number, number, number, number];
    /** Own conic fullness, dimensionless. */
    shoulder: number;
    /** Anatomical lateral direction's world-Z sign. */
    lateral: 1 | -1;
  }

  /** Parent source and numerical root support remain inspectable; this is not a continuous containment certificate.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Parent source and numerical root support remain inspectable; this is not a continuous containment certificate.
   * @evidence contracts/development/design.md#principled-representation `parent`: Identical actual source and its whole local chord reader. `phases`: Finite phase-refinement count, independent of render detail.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBreastConnection.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `parent`, `phases`; callers supply the complete record.
   */
  export interface IConnection extends IAutoMovieHumanMassSource.IConnection {
    /** Identical actual source and its whole local chord reader. */
    parent: IAutoMovieHumanGlutealParent.IParent;
    /** Finite phase-refinement count, independent of render detail. */
    phases: number;
  }
}
