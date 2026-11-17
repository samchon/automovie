import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { AutoMovieHumanSex } from "../AutoMovieHumanSex";
import type { IAutoMovieHumanArmConstruction } from "./IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanFootConstruction } from "./IAutoMovieHumanFootConstruction";
import type { IAutoMovieHumanLegConstruction } from "./IAutoMovieHumanLegConstruction";
import type { IAutoMovieHumanLimbRest } from "./IAutoMovieHumanLimbRest";
import type { IAutoMovieHumanTrunkLandmarks } from "./IAutoMovieHumanTrunkLandmarks";
import type { IAutoMovieHumanHandBones } from "./hand/IAutoMovieHumanHandBones";
import type { IAutoMovieHumanHeadLane } from "./head/IAutoMovieHumanHeadLane";

/** Type contracts exchanged by AutoMovieHumanSkeletonLaw; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanSkeletonLaw {
  /** One bone of the bind skeleton.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One bone of the bind skeleton.
   * @evidence contracts/development/design.md#principled-representation `bone`: Bone id; humanoid names where the engine vocabulary has one. `parent`: Parent bone, or null for the root `hips`. `position`: Joint centre in mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanSkeletonLaw.derive. Read by AutoMovieHumanArmConstruction.add, AutoMovieHumanArmConstruction.limb, AutoMovieHumanArmConstruction.elbowOf. Also types AutoMovieHumanArmConstruction.bone, AutoMovieHumanSkeletonLaw.bones.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bone`, `parent`, `position`, `toward`, `tip`; callers supply the complete record.
   */
  export interface IBone {
    /** Bone id; humanoid names where the engine vocabulary has one. */
    bone: string;

    /** Parent bone, or null for the root `hips`. */
    parent: string | null;

    /** Joint centre in mm. */
    position: [number, number, number];

    /** Point the bone's segment points to at rest, defining its long axis, mm. */
    toward: [number, number, number];

    /** End of a leaf bone's drawn segment in mm, null for a bone whose children end it. */
    tip: [number, number, number] | null;
  }

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
    bones: IBone[];

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
