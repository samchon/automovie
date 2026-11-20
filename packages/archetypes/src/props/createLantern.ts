import type { Archetype } from "../core";
import { PracticalLightConstruction } from "./PracticalLightConstruction";
import type { createLight } from "./createLight";

/**
 * A standing or hung lantern with a raised bail and a burner light binding.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A standing or hung lantern with a raised bail and a burner light binding.
 * @evidence contracts/development/implementation.md#principled-implementation The bail top supplies both the hand grip and hook. The light frame sits at the globe's foot.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Measured body and globe sizes retain the documented wire and fount estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Six solids and three contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createLantern(
  params: createLantern.IParams = {},
  seed?: number | string,
): Archetype<createLantern.Affordance, createLight.Dimension> {
  return PracticalLightConstruction.lantern(params, seed);
}

/**
 * The authorable settings and local contact IDs of {@link createLantern}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createLantern}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createLantern {
  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "light" | "hook";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createLight.IParams,
    "id" | "height" | "shade" | "overall" | "base" | "bail" | "mass"
  >;
}
