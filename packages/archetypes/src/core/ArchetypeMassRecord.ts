import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ArchetypeMass } from "./ArchetypeMass";
import { ArchetypeMassArithmetic } from "./ArchetypeMassArithmetic";

/**
 * Admission and final reduction of a mass-property record.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the one owner of scalar mass, finite record premises and complete tensor reduction.
 * @evidence contracts/development/design.md#principled-representation Uses the existing SI mass-property and six-component symmetric tensor records without another wrapper representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface mass, admit and finish serve of, parts, combine and about's shared input/output boundary; no material, geometry or rendering API is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite/nonnegative checks are numerical admission, not a claim to prove an authored tensor positive semidefinite or an authored placement rigid.
 */
export namespace ArchetypeMassRecord {
  /**
   * Admit total body mass before allocation or a moment calculation.
   * @param value Total mass, kilograms.
   * @throws {Error} Unless mass is finite and positive.
   * @evidence contracts/development/common.md#meaningful-documentation States SI units and the finite positive requirement.
   * @evidence contracts/development/implementation.md#principled-implementation Positive finite body mass is the existing body contract; no division or tensor computation proceeds on an unsupported total.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One predicate and refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cap or default body mass.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar admission.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One predicate serves all mass-property consumers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No retained state or resource.
   */
  export function mass(value: number): void {
    if (!(Number.isFinite(value) && value > 0))
      throw new Error("Mass properties need a finite positive total mass");
  }

  /**
   * Admit a finite record with nonnegative coordinate-axis moments.
   * @param properties SI mass, centre in metres and tensor in kg m².
   * @throws {Error} For unsupported mass, centre or tensor components.
   * @evidence contracts/development/common.md#meaningful-documentation States the checked components and the remaining tensor-consistency premise.
   * @evidence contracts/development/implementation.md#principled-implementation Requires positive finite mass, finite centre and all six tensor entries, and nonnegative diagonal moments. A physically consistent tensor and unit rigid placement remain the author/caller's premise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shared mass admission followed by fixed-component record checks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No guessed centre, zero tensor replacement or tolerance changes a record.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed-size record admission.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work combine, about and finish share this exact boundary.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No retained input or allocation beyond temporary scalar values.
   */
  export function admit(properties: ArchetypeMass.IProperties): void {
    mass(properties.mass);
    const centre: IAutoMovieVector3 = properties.centerOfMass;
    const inertia: ArchetypeMass.IInertia = properties.inertia;
    if (
      !(
        Number.isFinite(centre.x) &&
        Number.isFinite(centre.y) &&
        Number.isFinite(centre.z) &&
        Number.isFinite(inertia.xx) &&
        Number.isFinite(inertia.yy) &&
        Number.isFinite(inertia.zz) &&
        Number.isFinite(inertia.xy) &&
        Number.isFinite(inertia.xz) &&
        Number.isFinite(inertia.yz) &&
        inertia.xx >= 0 &&
        inertia.yy >= 0 &&
        inertia.zz >= 0
      )
    )
      throw new Error(
        "Mass properties need finite centre/tensor components and nonnegative principal-axis moments",
      );
  }

  /**
   * Finish each complete tensor sum before deciding output representability.
   * @param value Total mass, kilograms.
   * @param centre Common centre, metres.
   * @param terms Each axis component's contributions, kg m², in reduction order.
   * @returns One admitted mass-property record.
   * @throws {Error} For non-finite contributions or an unsupported final record.
   * @evidence contracts/development/common.md#meaningful-documentation States units, complete reduction ownership and final admission.
   * @evidence contracts/development/implementation.md#principled-implementation ArchetypeMassArithmetic.sum preserves ordinary accumulation and exactly resolves exceptional cancellation/overflow midpoint; admission applies to the finished six-component record rather than a partial sum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Six shared reductions, one record construction and one admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No partial component is capped or silently replaced, and no computed infinity escapes as a body record.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in contribution count across six axes, plus sum's exceptional bounded-width arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work of and combine use the same final reductions and admission.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only scalar output records escape; no contribution array is retained.
   */
  export function finish(
    value: number,
    centre: IAutoMovieVector3,
    terms: Record<keyof ArchetypeMass.IInertia, readonly number[]>,
  ): ArchetypeMass.IProperties {
    const result: ArchetypeMass.IProperties = {
      mass: value,
      centerOfMass: centre,
      inertia: {
        xx: ArchetypeMassArithmetic.sum(terms.xx),
        yy: ArchetypeMassArithmetic.sum(terms.yy),
        zz: ArchetypeMassArithmetic.sum(terms.zz),
        xy: ArchetypeMassArithmetic.sum(terms.xy),
        xz: ArchetypeMassArithmetic.sum(terms.xz),
        yz: ArchetypeMassArithmetic.sum(terms.yz),
      },
    };
    admit(result);
    return result;
  }
}
