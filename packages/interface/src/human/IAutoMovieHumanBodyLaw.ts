import type { IAutoMovieLoftChain } from "../construction/IAutoMovieLoftChain";
import type { IAutoMovieLoftContract } from "../construction/IAutoMovieLoftContract";
import type { IAutoMovieHumanHermiteCurve } from "./IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanArmConstruction } from "./IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyLane } from "./IAutoMovieHumanBodyLane";
import type { IAutoMovieHumanBodyPreparation } from "./IAutoMovieHumanBodyPreparation";
import type { IAutoMovieHumanCalibrationBone } from "./IAutoMovieHumanCalibrationBone";
import type { IAutoMovieHumanFootConstruction } from "./IAutoMovieHumanFootConstruction";
import type { IAutoMovieHumanLegConstruction } from "./IAutoMovieHumanLegConstruction";
import type { IAutoMovieHumanHandBones } from "./IAutoMovieHumanHandBones";
import type { IAutoMovieHumanHeadLane } from "./IAutoMovieHumanHeadLane";

/**
 * Calibration limb inputs and shared body source assembly before final solid
 * realization. Runtime construction and admission remain with
 * AutoMovieHumanBodyLaw in Human.
 */
export namespace IAutoMovieHumanBodyLaw {
  /**
   * Public limb definitions shared by construction and source-curve inspection,
   * before any skin.
   */
  export interface ILimbInputs {
    /** Stature in calibration mm. */
    stature: number;

    /** Leg tapes, anatomical controls and calibration scale. */
    legs: IAutoMovieHumanLegConstruction.IInputs;

    /** Arm tapes and each hand's own dimensions, calibration mm. */
    arms: IAutoMovieHumanArmConstruction.IInputs & {
      /**
       * Requested full shoulder breadth across both deltoids, calibration
       * millimetres.
       */
      bideltoid: number;
    };

    /** Each foot's own dimensions, calibration mm. */
    feet: IAutoMovieHumanFootConstruction.IInputs;

    /** Crotch height by the inseam definition, calibration mm. */
    crotch: number;
  }

  /** Calibrations for one parameter set. */
  export interface IOutput {
    /** Body chains, events, poles, apertures and globes in calibration mm. */
    body: IAutoMovieHumanBodyCalibration;

    /** Exterior lip boundary in the same frame. */
    vermilion: IAutoMovieHumanHermiteCurve;
  }

  /**
   * The shared production source assembly, explicitly before final solid
   * realization.
   */
  export interface IDefinition {
    /**
     * Identical invocation context for explicit original/raw requests and
     * legacy receiver observations.
     */
    prepared: IAutoMovieHumanBodyPreparation.IOutput;

    /** The exact body tree and source premises consumed by calibration. */
    lane: IAutoMovieHumanBodyLane.IDefinition;

    /** Existing neck/trunk metadata retained for the completed calibration. */
    standing: IAutoMovieHumanBodyCalibration;

    /** The actual generating head, including its identical composer source. */
    head: IAutoMovieHumanHeadLane.IOutput;

    /** Anatomically placed bind joints used by these same source parts. */
    skeleton: IAutoMovieHumanCalibrationBone[];

    /**
     * Identical hand definitions shared by bind joints and original digit
     * curves.
     */
    hands: Record<"left" | "right", IAutoMovieHumanHandBones.IOutput>;

    /** Stature in the calibration's millimetres. */
    stature: number;

    /**
     * Explicit engine-evaluated legacy neck interval; ordinary source/metadata
     * reads do not request raw geometry.
     */
    neckRaw(): IAutoMovieLoftChain;

    /** Anatomy and source assembly diagnostics; final joins have not run. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }
}
