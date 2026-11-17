import type { IAutoMovieHumanFootInterim } from "../foot/IAutoMovieHumanFootInterim";
import type { IAutoMovieHumanFootSource } from "../foot/IAutoMovieHumanFootSource";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";
import type { IAutoMovieHumanLegBones } from "./IAutoMovieHumanLegBones";
import type { IAutoMovieHumanLegWalk } from "./IAutoMovieHumanLegWalk";

/**
 * Type contracts exchanged by AutoMovieHumanLegSourceFamily; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanLegSourceFamily exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IOutput, IAnkle, IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanLegSourceFamily; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IOutput, IAnkle, IInput contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanLegSourceFamily {
  /** Regional and full demands of the same production family.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Regional and full demands of the same production family.
   * @evidence contracts/development/design.md#principled-representation Regional and full demands of the same production family.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegSourceFamily.create. Also types AutoMovieHumanLegSources.legSource.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegSourceFamily.create, AutoMovieHumanLegSources.legSource for regional and full demands of the same production family.
   */
  export interface IOutput {
    /**
     * Latest actual coupled definition, or the base before explicit assembly.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Latest actual coupled definition, or the base before explicit assembly.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanLegSourceFamily owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanLegSourceFamily.IOutput.current declares the invocation boundary only; AutoMovieHumanLegSourceFamily and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanLegSourceFamily.IOutput.current must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanLegSourceFamily.IOutput.current owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanLegSourceFamily and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanLegSourceFamily producer or caller supplying the callback owns captured state and its lifetime.
     */
    current(): IAutoMovieHumanLegWalk.IDefinition;

    /**
     * Same bounded calf-to-cap authority without forcing the full leg or upper-parent completion.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Same bounded calf-to-cap authority without forcing the full leg or upper-parent completion.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanLegSourceFamily owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanLegSourceFamily.IOutput.ankle declares the invocation boundary only; AutoMovieHumanLegSourceFamily and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanLegSourceFamily.IOutput.ankle must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanLegSourceFamily.IOutput.ankle owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanLegSourceFamily and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanLegSourceFamily producer or caller supplying the callback owns captured state and its lifetime.
     */
    ankle(): IAnkle;

    /**
     * Replace the current coupled definition with a trial or final proximal prefix against this parent at station in calibration millimetres; binding alone does not complete the parent.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Replace the current coupled definition with a trial or final proximal prefix against this parent at station in calibration millimetres; binding alone does not complete the parent.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanLegSourceFamily owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanLegSourceFamily.IOutput.bind declares the invocation boundary only; AutoMovieHumanLegSourceFamily and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanLegSourceFamily.IOutput.bind must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanLegSourceFamily.IOutput.bind owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanLegSourceFamily and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanLegSourceFamily producer or caller supplying the callback owns captured state and its lifetime.
     */
    bind(
      parent: IAutoMovieHumanSourceDefinition,
      station: number,
    ): IAutoMovieHumanLegWalk.IDefinition;
  }

  /** Exact retained region with the actual explicit full-resolver capability.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Exact retained region with the actual explicit full-resolver capability.
   * @evidence contracts/development/design.md#principled-representation Exact retained region with the actual explicit full-resolver capability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegSourceFamily.ankle.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegSourceFamily.ankle, AutoMovieHumanLegSourceFamily.create for exact retained region with the actual explicit full-resolver capability.
   */
  export type IAnkle = Omit<
    IAutoMovieHumanFootInterim.IAnkleSource,
    "source"
  > & {
    /** Only complete requests the real full original; name/frame/property reads remain local metadata. */
    source: IAutoMovieHumanFootSource.IRegional;
  };

  /** Invocation-owned production inputs and its optional full-parent completion seam.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Invocation-owned production inputs and its optional full-parent completion seam.
   * @evidence contracts/development/design.md#principled-representation `name`: Existing side-qualified production name. `bones`: Actual immutable bone frames. `law`: Existing measured and intermediate source laws.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegSourceFamily.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `complete`: Successfully complete the owning trunk before full demand, or throw its failure; binding a trial alone is not completion.
   */
  export interface IInput {
    /** Existing side-qualified production name. */
    name: string;

    /** Actual immutable bone frames. */
    bones: Pick<IAutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle">;
    /** Existing measured and intermediate source laws. */
    law: IAutoMovieHumanLegWalk.ILaw;

    /** Existing emission spacing, calibration mm. */
    gap: number;

    /**
     * Successfully complete the owning trunk before full demand, or throw its failure; binding a trial alone is not completion.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Successfully complete the owning trunk before full demand, or throw its failure; binding a trial alone is not completion.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanLegSourceFamily owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanLegSourceFamily.IInput.complete declares the invocation boundary only; AutoMovieHumanLegSourceFamily and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanLegSourceFamily.IInput.complete must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanLegSourceFamily.IInput.complete owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanLegSourceFamily and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanLegSourceFamily producer or caller supplying the callback owns captured state and its lifetime.
     */
    complete?: () => void;
  }
}
