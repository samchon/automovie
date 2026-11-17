import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanTrunkReliefNet } from "./IAutoMovieHumanTrunkReliefNet";

/**
 * Type contracts exchanged by AutoMovieHumanScapularMass; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanScapularMass exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanScapularMass; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IInput contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanScapularMass {
  /** What the mass reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the mass reads.
   * @evidence contracts/development/design.md#principled-representation `centre`: The back wall's point at the centre's lateral place, `[x, y, z]`, mm. `tangent`: The wall's section tangent there in `[x, z]`, in the direction of rising phase (back: z falling). `width`: The section's half width at the centre's height, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanScapularMass.feature, AutoMovieHumanScapularMass.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `centre`, `tangent`, `width`, `span`, `phaseOf`, `base`, `ceiling`; callers supply the complete record.
   */
  export interface IInput {
    /** The back wall's point at the centre's lateral place, `[x, y, z]`, mm. */
    centre: AutoMovieVector3Tuple;

    /** The wall's section tangent there in `[x, z]`, in the direction of rising phase (back: z falling). */
    tangent: [number, number];

    /** The section's half width at the centre's height, mm. */
    width: number;

    /** The crotch-to-cervicale span, mm. */
    span: number;

    /**
     * The base's phase at a lateral place on the back at the centre's height.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The base's phase at a lateral place on the back at the centre's height.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanScapularMass owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanScapularMass.IInput.phaseOf declares the invocation boundary only; AutoMovieHumanScapularMass and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanScapularMass.IInput.phaseOf must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanScapularMass.IInput.phaseOf owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanScapularMass and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanScapularMass producer or caller supplying the callback owns captured state and its lifetime.
     */
    phaseOf: (z: number) => number;

    /** The trunk's base surface. */
    base: IAutoMovieHumanTrunkReliefNet.Base;

    /** Height the window must stay under, mm: the shoulders' top less a clearance. */
    ceiling: number;
  }
}
