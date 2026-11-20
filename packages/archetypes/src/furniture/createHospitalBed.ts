import type { Archetype } from "../core";
import { BedConstruction } from "./BedConstruction";
import type { createBed } from "./createBed";

/**
 * A hospital bed with a caster base, patient support and bars along both sides.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A hospital bed with a caster base, patient support and bars along both sides.
 * @evidence contracts/development/implementation.md#principled-implementation The lying or seated contact is at the mattress top. The bars remain on the modeled rail tops.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The admitted litter height is in metres. Measured proportions and supported flat geometry retain their original meanings.
 * @evidence contracts/development/implementation.md#efficient-algorithms Eight solids and five contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createHospitalBed(
  params: createHospitalBed.IParams = {},
  seed?: number | string,
): Archetype<createHospitalBed.Affordance, createBed.Dimension> {
  return BedConstruction.hospital(params, seed);
}

/**
 * The authorable settings and local contact IDs of {@link createHospitalBed}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createHospitalBed}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createHospitalBed {
  /** The contact IDs declared by this producer. */
  export type Affordance =
    | "surface"
    | "leftSide"
    | "rightSide"
    | "leftRail"
    | "rightRail";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createBed.IParams,
    | "id"
    | "width"
    | "length"
    | "overallLength"
    | "overallWidth"
    | "litter"
    | "thickness"
    | "rail"
    | "mass"
  >;
}
