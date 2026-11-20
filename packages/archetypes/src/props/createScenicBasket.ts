import { type Archetype, ArchetypeDraw } from "../core";
import { ScenicContainerConstruction } from "./ScenicContainerConstruction";
import type { createScenicContainer } from "./createScenicContainer";

/**
 * A closed coil basket or open fish basket, with a supported placement surface.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A closed coil basket or open fish basket, with a supported placement surface.
 * @evidence contracts/development/implementation.md#principled-implementation The closed silhouette carries a footprint on its lid; the open one carries it on its real floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The metre dimensions describe the original coarse container geometry.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of model solids.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createScenicBasket(
  params: createScenicBasket.IParams,
  seed?: number | string,
): Archetype<createScenicBasket.Affordance, createScenicContainer.Dimension> {
  return ScenicContainerConstruction.baskets(
    ArchetypeDraw.choice(
      "scenicContainer",
      "kind",
      params.kind,
      createScenicBasket.KINDS,
    ),
    params,
    seed,
  );
}

/**
 * The authorable settings and local contact IDs of {@link createScenicBasket}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createScenicBasket}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createScenicBasket {
  /** The contact IDs declared by this producer. */
  export type Affordance = "top" | "inside";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > & {
    /** A closed coil basket or an open fish basket. */
    kind: "coilBasket" | "woodenFishBasket";
  };

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = [
    "coilBasket",
    "woodenFishBasket",
  ];
}
