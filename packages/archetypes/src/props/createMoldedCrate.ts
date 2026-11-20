import type { Archetype } from "../core";
import { ScenicContainerConstruction } from "./ScenicContainerConstruction";
import type { createScenicContainer } from "./createScenicContainer";

/**
 * An open molded crate with a floor suitable for receiving arranged loads.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An open molded crate with a floor suitable for receiving arranged loads.
 * @evidence contracts/development/implementation.md#principled-implementation The placement footprint lies inside the walls, on the modeled floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Visible wall ribs leave the central interior clear above the floor.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed rib and rim inventory.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createMoldedCrate(
  params: createMoldedCrate.IParams = {},
  seed?: number | string,
): Archetype<createMoldedCrate.Affordance, createScenicContainer.Dimension> {
  return ScenicContainerConstruction.openCrate(params, seed);
}

/**
 * The authorable settings and local contact IDs of {@link createMoldedCrate}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createMoldedCrate}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createMoldedCrate {
  /** The contact IDs declared by this producer. */
  export type Affordance = "inside";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;
}
