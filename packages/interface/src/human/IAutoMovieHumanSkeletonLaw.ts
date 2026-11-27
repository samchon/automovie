import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { AutoMovieHumanSex } from "./AutoMovieHumanSex";
import type { IAutoMovieHumanArmConstruction } from "./IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanCalibrationBone } from "./IAutoMovieHumanCalibrationBone";
import type { IAutoMovieHumanFootConstruction } from "./IAutoMovieHumanFootConstruction";
import type { IAutoMovieHumanLegConstruction } from "./IAutoMovieHumanLegConstruction";
import type { IAutoMovieHumanLimbRest } from "./IAutoMovieHumanLimbRest";
import type { IAutoMovieHumanTrunkLandmarks } from "./IAutoMovieHumanTrunkLandmarks";
import type { IAutoMovieHumanHandBones } from "./IAutoMovieHumanHandBones";
import type { IAutoMovieHumanHeadLane } from "./IAutoMovieHumanHeadLane";

/**
 * Parent-before-child bind bone records and the shared anatomical inputs used
 * to place them. Runtime construction and admission remain with
 * AutoMovieHumanSkeletonLaw in Human.
 */
export namespace IAutoMovieHumanSkeletonLaw {
  /**
   * Bind bones and the identical pure hand records from which their joints were
   * placed.
   */
  export interface IOutput {
    /** Parent-before-child bone records. */
    bones: IAutoMovieHumanCalibrationBone[];

    /** Actual sided joint/material-frame definitions, before any digit skin. */
    hands: Record<"left" | "right", IAutoMovieHumanHandBones.IOutput>;
  }

  /** What the skeleton reads besides the root. */
  export interface IInputs {
    /** The arms' lengths, tapes and hands. */
    arms: IAutoMovieHumanArmConstruction.IInputs;

    /** The feet's dimensions. */
    feet: IAutoMovieHumanFootConstruction.IInputs;

    /** The legs' tapes and controls. */
    legs: IAutoMovieHumanLegConstruction.IInputs;

    /**
     * The trunk's defining landmarks the skeleton reads, canonical left side:
     * the column's axis, the crotch height and the shoulder's two points.
     */
    trunk: Pick<
      IAutoMovieHumanTrunkLandmarks,
      "axis" | "crotch" | "shoulder" | "glenohumeral"
    >;

    /** The generating head lane's joint and eye references. */
    head: Pick<IAutoMovieHumanHeadLane.IOutput, "skeleton" | "eyes">;

    /** The resolved anatomical sex used by digit dimensions. */
    sex: AutoMovieHumanSex;
  }

  /**
   * Body-owned joints and their true neck attachment datum; no head mass or eye
   * placement is needed.
   */
  export type IBodyInputs = Omit<IInputs, "head"> & {
    /** Shared world neck-base position in calibration mm. */
    neckBase: AutoMovieVector3Tuple;

    /** Shared normal-neck lateral scale in calibration mm. */
    neckRadius: number;

    /**
     * Same invocation's independent original rest owner; absent only for legacy
     * direct callers.
     */
    limbs?: IAutoMovieHumanLimbRest.IOutput;
  };
}
