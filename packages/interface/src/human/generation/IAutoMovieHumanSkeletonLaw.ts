import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { AutoMovieHumanSex } from "../AutoMovieHumanSex";
import type { IAutoMovieHumanArmConstruction } from "./IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanCalibrationBone } from "./IAutoMovieHumanCalibrationBone";
import type { IAutoMovieHumanFootConstruction } from "./IAutoMovieHumanFootConstruction";
import type { IAutoMovieHumanLegConstruction } from "./IAutoMovieHumanLegConstruction";
import type { IAutoMovieHumanLimbRest } from "./IAutoMovieHumanLimbRest";
import type { IAutoMovieHumanTrunkLandmarks } from "./IAutoMovieHumanTrunkLandmarks";
import type { IAutoMovieHumanHandBones } from "./hand/IAutoMovieHumanHandBones";
import type { IAutoMovieHumanHeadLane } from "./head/IAutoMovieHumanHeadLane";

/**
 * Parent-before-child bind bone records and the shared anatomical inputs used to place them. Runtime construction and admission remain with AutoMovieHumanSkeletonLaw in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes parent-before-child bind bone records and the shared anatomical inputs used to place them; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Parent-before-child bind bone records and the shared anatomical inputs used to place them. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanSkeletonLaw; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing SkeletonLaw contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanSkeletonLaw {
  /** Bind bones and the identical pure hand records from which their joints were placed.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Bind bones and the identical pure hand records from which their joints were placed.
   * @evidence contracts/development/design.md#principled-representation `bones`: Parent-before-child bone records. `hands`: Actual sided joint/material-frame definitions, before any digit skin.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanSkeletonLaw.define, AutoMovieHumanSkeletonLaw.body, AutoMovieHumanSkeletonLaw.complete. Read by AutoMovieHumanSkeletonLaw.complete. Also types AutoMovieHumanBodyPreparation.anatomy, AutoMovieHumanBodySources.anatomy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bones`, `hands`; callers supply the complete record.
   */
  export interface IOutput {
    /** Parent-before-child bone records. */
    bones: IAutoMovieHumanCalibrationBone[];

    /** Actual sided joint/material-frame definitions, before any digit skin. */
    hands: Record<"left" | "right", IAutoMovieHumanHandBones.IOutput>;
  }

  /** What the skeleton reads besides the root.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the skeleton reads besides the root.
   * @evidence contracts/development/design.md#principled-representation `arms`: The arms' lengths, tapes and hands. `feet`: The feet's dimensions. `legs`: The legs' tapes and controls.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanSkeletonLaw.derive, AutoMovieHumanSkeletonLaw.define, AutoMovieHumanSkeletonLaw.complete.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `arms`, `feet`, `legs`, `trunk`, `head`, `sex`; callers supply the complete record.
   */
  export interface IInputs {
    /** The arms' lengths, tapes and hands. */
    arms: IAutoMovieHumanArmConstruction.IInputs;

    /** The feet's dimensions. */
    feet: IAutoMovieHumanFootConstruction.IInputs;

    /** The legs' tapes and controls. */
    legs: IAutoMovieHumanLegConstruction.IInputs;

    /** The trunk's defining landmarks, canonical left side. */
    trunk: IAutoMovieHumanTrunkLandmarks;

    /** The generating head lane's joint and eye references. */
    head: Pick<IAutoMovieHumanHeadLane.IOutput, "skeleton" | "eyes">;

    /** The resolved anatomical sex used by digit dimensions. */
    sex: AutoMovieHumanSex;
  }

  /** Body-owned joints and their true neck attachment datum; no head mass or eye placement is needed.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Body-owned joints and their true neck attachment datum; no head mass or eye placement is needed.
   * @evidence contracts/development/design.md#principled-representation Body-owned joints and their true neck attachment datum; no head mass or eye placement is needed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanSkeletonLaw.body, AutoMovieHumanSkeletonLaw.build.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSkeletonLaw.body, AutoMovieHumanSkeletonLaw.build for body-owned joints and their true neck attachment datum; no head mass or eye placement is needed.
   */
  export type IBodyInputs = Omit<IInputs, "head"> & {
    /** Shared world neck-base position in calibration mm. */
    neckBase: AutoMovieVector3Tuple;

    /** Shared normal-neck lateral scale in calibration mm. */
    neckRadius: number;

    /** Same invocation's independent original rest owner; absent only for legacy direct callers. */
    limbs?: IAutoMovieHumanLimbRest.IOutput;
  };
}
