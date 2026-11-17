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
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanLegSources owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanLegSources.IOutput.foot declares the invocation boundary only; AutoMovieHumanLegSources and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanLegSources.IOutput.foot must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanLegSources.IOutput.foot owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanLegSources and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanLegSources producer or caller supplying the callback owns captured state and its lifetime.
     */
    foot(): IAutoMovieHumanBodyLane.ISide["foot"];

    /**
     * Same foot original consumed by its explicit loft.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Same foot original consumed by its explicit loft.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanLegSources owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanLegSources.IOutput.definition declares the invocation boundary only; AutoMovieHumanLegSources and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanLegSources.IOutput.definition must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanLegSources.IOutput.definition owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanLegSources and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanLegSources producer or caller supplying the callback owns captured state and its lifetime.
     */
    definition(): IAutoMovieHumanSourceDefinition;

    /**
     * Explicit toe originals from the same foot controls.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit toe originals from the same foot controls.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanLegSources owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanLegSources.IOutput.toes declares the invocation boundary only; AutoMovieHumanLegSources and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanLegSources.IOutput.toes must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanLegSources.IOutput.toes owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanLegSources and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanLegSources producer or caller supplying the callback owns captured state and its lifetime.
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
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanLegSources owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanLegSources.IInput.completeLeg declares the invocation boundary only; AutoMovieHumanLegSources and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanLegSources.IInput.completeLeg must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanLegSources.IInput.completeLeg owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanLegSources and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanLegSources producer or caller supplying the callback owns captured state and its lifetime.
     */
    completeLeg?: () => void;
  }
}
