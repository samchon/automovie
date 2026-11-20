import type { Archetype } from "../core";
import { VesselConstruction } from "./VesselConstruction";
import type { createVessel } from "./createVessel";

/**
 * An ashtray with an inside floor and a precision grip from beneath.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An ashtray with an inside floor and a precision grip from beneath.
 * @evidence contracts/development/implementation.md#principled-implementation The upward floor supports placed objects and the bottom grip follows the floor thickness.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses recorded ashtray dimensions. These dimensions belong to the model.
 * @evidence contracts/development/implementation.md#efficient-algorithms Five solids and three contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createAshtray(
  params: createAshtray.IParams = {},
  seed?: number | string,
): Archetype<createAshtray.Affordance, createVessel.Dimension> {
  return VesselConstruction.ashtray(params, seed);
}

/**
 * The authorable settings and local contact IDs of {@link createAshtray}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createAshtray}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createAshtray {
  /** The contact IDs declared by this producer. */
  export type Affordance = "rim" | "inside" | "body";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<createVessel.IParams, "id"> & {
    /** The recorded ashtray. The seed selects it when omitted. */
    model?: "nachtmann" | "harris";
  };
}
