import { type Archetype, ArchetypeDraw } from "../core";
import { VesselConstruction } from "./VesselConstruction";
import type { createVessel } from "./createVessel";

/**
 * A saucepan with a long handle or a stockpot with paired side handles.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A saucepan with a long handle or a stockpot with paired side handles.
 * @evidence contracts/development/implementation.md#principled-implementation The two cooking forms share an open floor and rim. Their grip contacts stay on their own handle axes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the measured bands and each handle's stated estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most seven solids and four contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createCookingPot(
  params: createCookingPot.IParams,
  seed?: number | string,
): Archetype<createCookingPot.Affordance, createVessel.Dimension> {
  return VesselConstruction.cookingPot(
    ArchetypeDraw.choice("vessel", "kind", params.kind, createCookingPot.KINDS),
    params,
    seed,
  );
}

/**
 * The authorable settings and local contact IDs of {@link createCookingPot}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createCookingPot}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createCookingPot {
  /** The contact IDs declared by this producer. */
  export type Affordance =
    | "rim"
    | "inside"
    | "handle"
    | "leftHandle"
    | "rightHandle";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createVessel.IParams,
    "id" | "diameter" | "height" | "mass"
  > & {
    /** A single long handle or a two-handle cooking pot. */
    kind: "saucepan" | "stockpot";
  };

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["saucepan", "stockpot"];
}
