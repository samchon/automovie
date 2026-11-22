import type { AutoMovieArchetype } from "../core";
import { ScenicContainerConstruction } from "./ScenicContainerConstruction";
import type { createScenicContainer } from "./createScenicContainer";

/**
 * A faceted cargo pod with a lower mounting socket and an upper stacking footprint.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A faceted cargo pod with a lower mounting socket and an upper stacking footprint.
 * @evidence contracts/development/implementation.md#principled-implementation The mounting socket aligns the bottom face's centre with the host frame. The cap supports the original top rectangle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The base contact locates the complete prop. The cap and coarse shell retain the original silhouette and metre dimensions.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three solids and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createCargoPod(
  params: createCargoPod.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createCargoPod.Affordance, createCargoPod.Dimension> {
  return ScenicContainerConstruction.mountedPod(params, seed);
}

/**
 * The authorable settings and local contact IDs of {@link createCargoPod}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createCargoPod}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createCargoPod {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "mount" | "top";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;
}
