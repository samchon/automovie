import type { IAutoMovieLoftContract } from "../../construction/IAutoMovieLoftContract";
import type { IAutoMovieViewPart } from "../../construction/IAutoMovieViewPart";
import type { AutoMovieHumanSide } from "../AutoMovieHumanSide";
import type { IAutoMovieHumanArmConstruction } from "./IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanFootConstruction } from "./IAutoMovieHumanFootConstruction";
import type { IAutoMovieHumanLimbRest } from "./IAutoMovieHumanLimbRest";
import type { IAutoMovieHumanArmSources } from "./arm/IAutoMovieHumanArmSources";
import type { IAutoMovieHumanLegSources } from "./leg/IAutoMovieHumanLegSources";

/**
 * Side-specific arm and leg source requests over shared resolved measures and
 * direct rest definitions.
 *
 * The interface package owns these declarations; AutoMovieHumanLimbSources in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanLimbSources {
  /** Source requests, with no implicit opposite-side or parent preparation. */
  export interface IOutput {
    /** Prepare just this arm/hand source owner. */
    arm(side: AutoMovieHumanSide): IAutoMovieHumanArmSources.IOutput;

    /** Prepare just this leg/distal source owner. */
    leg(side: AutoMovieHumanSide): IAutoMovieHumanLegSources.IOutput;
  }

  /** Same public dimensions and direct rest definitions as production. */
  export interface IInput {
    /** Actual direct numerical rest owner, without whole bind publication. */
    rest: IAutoMovieHumanLimbRest.IOutput;

    /** Resolved public measures; no geometry is acquired to obtain them. */
    measures: IAutoMovieHumanBodyMeasures;

    /** Public arm and hand dimensions. */
    arms: IAutoMovieHumanArmConstruction.IInputs & {
      /**
       * Requested full shoulder breadth across both deltoids, calibration
       * millimetres.
       */
      bideltoid: number;
    };

    /** Public foot dimensions. */
    feet: IAutoMovieHumanFootConstruction.IInputs;

    /** Calibration scale. */
    scale: number;

    /** Actual original crotch height, calibration mm. */
    crotch: number;

    /** Invocation-owned findings. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];

    /** Complete the genuine coupled parent only at its explicit full demand. */
    completeLeg?: (side: AutoMovieHumanSide) => IAutoMovieViewPart;
  }
}
