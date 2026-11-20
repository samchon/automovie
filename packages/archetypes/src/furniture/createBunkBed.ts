import type { Archetype } from "../core";
import { BedConstruction } from "./BedConstruction";
import type { createBed } from "./createBed";

/**
 * A stacked pair of beds with lower side seats, an upper sleep surface and a guard bar.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A stacked pair of beds with lower side seats, an upper sleep surface and a guard bar.
 * @evidence contracts/development/implementation.md#principled-implementation The four main posts support both mattresses and the upper mattress is behind the guard rail.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Pine legs keep their original friction pair. The mattress and frame dimensions retain their metre units.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed assembly plus its mattress and guard contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createBunkBed(
  params: createBunkBed.IParams = {},
  seed?: number | string,
): Archetype<createBunkBed.Affordance, createBed.Dimension> {
  return BedConstruction.bunk(params, seed);
}

/**
 * The authorable settings and local contact IDs of {@link createBunkBed}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createBunkBed}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createBunkBed {
  /** The contact IDs declared by this producer. */
  export type Affordance =
    | "surface"
    | "leftSide"
    | "rightSide"
    | "upper"
    | "guard";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createBed.IParams,
    | "id"
    | "width"
    | "length"
    | "height"
    | "thickness"
    | "overallLength"
    | "overallWidth"
    | "clearance"
    | "gap"
    | "mass"
  >;
}
