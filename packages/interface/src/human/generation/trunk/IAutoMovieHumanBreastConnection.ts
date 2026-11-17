import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanMassSource } from "../limb/IAutoMovieHumanMassSource";
import type { IAutoMovieHumanGlutealParent } from "./IAutoMovieHumanGlutealParent";

/** Type contracts exchanged by AutoMovieHumanBreastConnection; runtime evaluation remains in Human. */
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
