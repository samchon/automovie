import type { AutoMovieArchetype } from "../core";
import { BedConstruction } from "./BedConstruction";
import type { createBed } from "./createBed";

/**
 * A crib with a surrounding slat frame and grasp bars on both sides.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A crib with a surrounding slat frame and grasp bars on both sides.
 * @evidence contracts/development/implementation.md#principled-implementation The mattress is inside the rails. The bars follow the long top rails.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The former crib bands and the admitted dimensions apply, in metres and kilograms.
 * @evidence contracts/development/implementation.md#efficient-algorithms Work follows the number of slats required along the rails.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createCrib(
  params: createCrib.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createCrib.Affordance, createCrib.Dimension> {
  return BedConstruction.crib(params, seed);
}

/**
 * The authorable settings and local contact IDs of {@link createCrib}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createCrib}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createCrib {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension =
    | "height"
    | "length"
    | "mass"
    | "rail"
    | "thickness"
    | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "leftRail" | "rightRail" | "surface";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createBed.IParams,
    "id" | "width" | "length" | "height" | "rail" | "thickness" | "mass"
  >;
}
