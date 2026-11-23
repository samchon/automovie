import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieHumanBodyLane } from "../IAutoMovieHumanBodyLane";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanFootConstruction } from "../IAutoMovieHumanFootConstruction";
import type { IAutoMovieHumanLimbRest } from "../IAutoMovieHumanLimbRest";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";
import type { IAutoMovieHumanLegSourceFamily } from "./IAutoMovieHumanLegSourceFamily";
import type { IAutoMovieHumanLegWalk } from "./IAutoMovieHumanLegWalk";

/**
 * Type contracts exchanged by AutoMovieHumanLegSources; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanLegSources exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IOutput, IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanLegSources; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IOutput, IInput contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanLegSources {
  /** Prejoin originals and the honest explicit coupled-parent seam.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Prejoin originals and the honest explicit coupled-parent seam.
   * @evidence contracts/development/design.md#principled-representation `leg`: The same call-owned leg family used by production's eventual bind. `bones`: Actual shared rest joints used by the same original source. `law`: Original leg law.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegSources.create. Also types AutoMovieHumanLimbSources.legs, AutoMovieHumanLimbSources.previous.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `leg`, `bones`, `law`; callers supply the complete record.
   */
  export interface IOutput {
    /** The same call-owned leg family used by production's eventual bind. */
    leg: IAutoMovieHumanLegSourceFamily.IOutput;

    /** Actual shared rest joints used by the same original source. */
    bones: Pick<IAutoMovieHumanLimbRest.ILeg, "hip" | "knee" | "ankle">;

    /** Original leg law. */
    law: IAutoMovieHumanLegWalk.ILaw;

    /**
     * Explicit foot input request, using only its actual distal authority.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit foot input request, using only its actual distal authority.
     */
    foot(): IAutoMovieHumanBodyLane.ISide["foot"];

    /**
     * Same foot original consumed by its explicit loft.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Same foot original consumed by its explicit loft.
     */
    definition(): IAutoMovieHumanSourceDefinition;

    /**
     * Explicit toe originals from the same foot controls.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit toe originals from the same foot controls.
     */
    toes(): IAutoMovieHumanBodyLane.IToe[];
  }

  /** Public inputs and their directly generated rest/attachment datum.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Public inputs and their directly generated rest/attachment datum.
   * @evidence contracts/development/design.md#principled-representation `side`: Canonical source side. `rest`: Actual rest joints and local foot centres, before any skin. `feet`: Sided public foot dimensions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegSources.create. Also types AutoMovieHumanLegSources.side.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `completeLeg`: Explicit full-parent demand; ordinary ankle/foot/original reads do not call it.
   */
  export interface IInput {
    /** Canonical source side. */
    side: "left" | "right";

    /** Actual rest joints and local foot centres, before any skin. */
    rest: IAutoMovieHumanLimbRest.ILeg;

    /** Sided public foot dimensions. */
    feet: IAutoMovieHumanFootConstruction.IInputs;

    /** Same resolved public body measures. */
    measures: IAutoMovieHumanBodyMeasures;

    /** Calibration millimetres per world millimetre. */
    scale: number;

    /** Original crotch station in calibration mm. */
    crotch: number;

    /** Actual shared diagnostic sink. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];

    /**
     * Explicit full-parent demand; ordinary ankle/foot/original reads do not call it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit full-parent demand; ordinary ankle/foot/original reads do not call it.
     */
    completeLeg?: () => void;
  }
}
