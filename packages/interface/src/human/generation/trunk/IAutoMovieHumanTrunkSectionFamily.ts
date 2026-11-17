import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieViewSection } from "../../../construction/IAutoMovieViewSection";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/**
 * Type contracts exchanged by AutoMovieHumanTrunkSectionFamily; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanTrunkSectionFamily exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IPlane, IFullness. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanTrunkSectionFamily; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IPlane, IFullness contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanTrunkSectionFamily {
  /** One named measurement plane and its caller-owned four-support source.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One named measurement plane and its caller-owned four-support source.
   * @evidence contracts/development/design.md#principled-representation `site`: Original anatomical site name, independent of output sampling. `y`: World-Y station in calibration millimetres. `origin`: Section origin in world X/Z, calibration millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkSectionFamily.define, AutoMovieHumanTrunkSectionFamily.at. Read by AutoMovieHumanTrunkLegs.trial, AutoMovieHumanTrunkSectionFamily.define, AutoMovieHumanTrunkSectionFamily.at. Also types AutoMovieHumanTrunkBuild.sections, AutoMovieHumanTrunkBuild.plane.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `site`, `y`, `origin`, `back`, `box`, `fullness`; callers supply the complete record.
   */
  export interface IPlane {
    /** Original anatomical site name, independent of output sampling. */
    site: string;
    /** World-Y station in calibration millimetres. */
    y: number;
    /** Section origin in world X/Z, calibration millimetres. */
    origin: [number, number];
    /** Independent original posterior profile value, retained without subtractive reconstruction. */
    back: number;
    /** The same original support box consumed by the trunk's view construction. */
    box: IAutoMovieViewSection.IBox;
    /** Original independent fullness input; a changed tape requires a new family. */
    fullness: IAutoMovieHumanTrunkViews.ISite["fullness"];
    /**
     * Solve this unchanged box/tape once at its first original-source demand.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Solve this unchanged box/tape once at its first original-source demand.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanTrunkSectionFamily owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanTrunkSectionFamily.IPlane.resolve declares the invocation boundary only; AutoMovieHumanTrunkSectionFamily and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanTrunkSectionFamily.IPlane.resolve must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanTrunkSectionFamily.IPlane.resolve owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanTrunkSectionFamily and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanTrunkSectionFamily producer or caller supplying the callback owns captured state and its lifetime.
     */
    resolve(): IFullness;
    /**
     * Evaluate that original plane's conic family at the actual candidate shoulder.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Evaluate that original plane's conic family at the actual candidate shoulder.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanTrunkSectionFamily owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanTrunkSectionFamily.IPlane.section declares the invocation boundary only; AutoMovieHumanTrunkSectionFamily and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanTrunkSectionFamily.IPlane.section must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanTrunkSectionFamily.IPlane.section owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanTrunkSectionFamily and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanTrunkSectionFamily producer or caller supplying the callback owns captured state and its lifetime.
     */
    section(shoulder: number): IAutoMovieViewSection.ISection;
    /**
     * Admit this exact support box's native shoulder reach once, including a null refusal.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Admit this exact support box's native shoulder reach once, including a null refusal.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanTrunkSectionFamily owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanTrunkSectionFamily.IPlane.range declares the invocation boundary only; AutoMovieHumanTrunkSectionFamily and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanTrunkSectionFamily.IPlane.range must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanTrunkSectionFamily.IPlane.range owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanTrunkSectionFamily and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanTrunkSectionFamily producer or caller supplying the callback owns captured state and its lifetime.
     */
    range(): IAutoMovieViewSection.IRange | null;
  }

  /** The actual independent scalar constraint result, including its unchanged admission failures.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The actual independent scalar constraint result, including its unchanged admission failures.
   * @evidence contracts/development/design.md#principled-representation `fullness`: Null preserves a failed original section rather than selecting another shoulder. `diagnostics`: Original section-solve diagnostics, with the same source/site producer.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanTrunkSectionFamily.resolved, AutoMovieHumanTrunkViewPart.solved.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `fullness`, `diagnostics`; callers supply the complete record.
   */
  export interface IFullness {
    /** Null preserves a failed original section rather than selecting another shoulder. */
    fullness: {
      /** Dimensionless native conic shoulder controlling section fullness; the owning section builder admits its range. */
      shoulder: number;
    } | null;
    /** Original section-solve diagnostics, with the same source/site producer. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }
}
