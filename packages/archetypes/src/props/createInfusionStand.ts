import type { Archetype } from "../core";
import { MobilityAidConstruction } from "./MobilityAidConstruction";
import type { createMobilityAid } from "./createMobilityAid";

/**
 * A mobile infusion stand with a tube grip and a top bag hook.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A mobile infusion stand with a tube grip and a top bag hook.
 * @evidence contracts/development/implementation.md#principled-implementation Five caster legs support the telescoping tubes. The bag hook lies on the top of the stand.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the manufacturer's bands and estimated simplified geometry.
 * @evidence contracts/development/implementation.md#efficient-algorithms Twelve solids and three contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createInfusionStand(
  params: createInfusionStand.IParams = {},
  seed?: number | string,
): Archetype<createInfusionStand.Affordance, createMobilityAid.Dimension> {
  return MobilityAidConstruction.infusionStand(params, seed);
}

/**
 * The authorable settings and local contact IDs of {@link createInfusionStand}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createInfusionStand}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createInfusionStand {
  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "tip" | "hook";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createMobilityAid.IParams,
    "id" | "height" | "diameter" | "width" | "mass"
  >;
}
