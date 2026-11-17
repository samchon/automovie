import type { IAutoMovieLoftContract } from "../../construction/IAutoMovieLoftContract";
import type { AutoMovieHumanSide } from "../AutoMovieHumanSide";
import type { IAutoMovieHumanArmConstruction } from "./IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanFootConstruction } from "./IAutoMovieHumanFootConstruction";
import type { IAutoMovieHumanLimbRest } from "./IAutoMovieHumanLimbRest";
import type { IAutoMovieHumanArmSources } from "./arm/IAutoMovieHumanArmSources";
import type { IAutoMovieHumanLegSources } from "./leg/IAutoMovieHumanLegSources";

/** Type contracts exchanged by AutoMovieHumanLimbSources; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLimbSources {
  /** Source requests, with no implicit opposite-side or parent preparation.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Source requests, with no implicit opposite-side or parent preparation.
   * @evidence contracts/development/design.md#principled-representation Source requests, with no implicit opposite-side or parent preparation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLimbSources.create. Also types AutoMovieHumanBodyLaneInterim.own, AutoMovieHumanBodySources.limbs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyLaneInterim.own, AutoMovieHumanBodySources.limbs, AutoMovieHumanBodySources.limbSources, AutoMovieHumanLimbSources.create for source requests, with no implicit opposite-side or parent preparation.
   */
  export interface IOutput {
    /** Prepare just this arm/hand source owner. */
    arm(side: AutoMovieHumanSide): IAutoMovieHumanArmSources.IOutput;

    /** Prepare just this leg/distal source owner. */
    leg(side: AutoMovieHumanSide): IAutoMovieHumanLegSources.IOutput;
  }

  /** Same public dimensions and direct rest definitions as production.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Same public dimensions and direct rest definitions as production.
   * @evidence contracts/development/design.md#principled-representation `rest`: Actual direct numerical rest owner, without whole bind publication. `measures`: Resolved public measures; no geometry is acquired to obtain them. `arms`: Public arm and hand dimensions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLimbSources.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `completeLeg`: Complete the genuine coupled parent only at its explicit full demand.
   */
  export interface IInput {
    /** Actual direct numerical rest owner, without whole bind publication. */
    rest: IAutoMovieHumanLimbRest.IOutput;

    /** Resolved public measures; no geometry is acquired to obtain them. */
    measures: IAutoMovieHumanBodyMeasures;

    /** Public arm and hand dimensions. */
    arms: IAutoMovieHumanArmConstruction.IInputs & {
      /** Requested full shoulder breadth across both deltoids, calibration millimetres. */
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
    completeLeg?: () => void;
  }
}
