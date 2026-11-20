import { type Archetype, ArchetypeDraw } from "../core";
import { PracticalLightConstruction } from "./PracticalLightConstruction";
import type { createLight } from "./createLight";

/**
 * A freestanding table or floor lamp with a positioned light binding.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A freestanding table or floor lamp with a positioned light binding.
 * @evidence contracts/development/implementation.md#principled-implementation The measured stem holds the light in the shade. The side grip follows the shade itself.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The two forms retain their own measured dimensions and mass. The assembly supplies the rendered light effect.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three solids and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createStandingLamp(
  params: createStandingLamp.IParams,
  seed?: number | string,
): Archetype<createStandingLamp.Affordance, createLight.Dimension> {
  return PracticalLightConstruction.standing(
    ArchetypeDraw.choice(
      "light",
      "kind",
      params.kind,
      createStandingLamp.KINDS,
    ),
    params,
    seed,
  );
}

/**
 * The authorable settings and local contact IDs of {@link createStandingLamp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createStandingLamp}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createStandingLamp {
  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "light";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createLight.IParams,
    "id" | "height" | "shade" | "overall" | "stem" | "base" | "mass"
  > & {
    /** The measured table or floor form. */
    kind: "tableLamp" | "floorLamp";
  };

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["tableLamp", "floorLamp"];
}
