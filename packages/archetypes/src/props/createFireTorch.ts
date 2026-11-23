import type { AutoMovieArchetype } from "../core";
import { PracticalLightConstruction } from "./PracticalLightConstruction";
import type { createLight } from "./createLight";

/**
 * A period torch prop with a power grasp and an animated light frame.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A period torch prop with a power grasp and an animated light frame.
 * @evidence contracts/development/implementation.md#principled-implementation The grasp follows the shaft below its head. The light marks the top edge of the prop.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The coarse geometry retains the previous prop estimate and the assembly supplies the rendered light effect.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two solids and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createFireTorch(
  params: createFireTorch.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createFireTorch.Affordance, createFireTorch.Dimension> {
  return PracticalLightConstruction.wick("fireTorch", params, seed);
}

/**
 * The authorable settings and local contact IDs of {@link createFireTorch}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createFireTorch}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createFireTorch {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "diameter" | "headDiameter" | "length" | "mass";

  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "light";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createLight.IParams,
    "id" | "length" | "diameter" | "headDiameter" | "mass"
  >;
}
