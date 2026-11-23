import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { ScenicContainerConstruction } from "./ScenicContainerConstruction";
import type { createScenicContainer } from "./createScenicContainer";

/**
 * A closed coil basket or open fish basket, with a supported placement surface.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createScenicBasket(
  params: createScenicBasket.IParams,
  seed?: number | string,
): AutoMovieArchetype<
  createScenicBasket.Affordance,
  createScenicBasket.Dimension
> {
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

/** The authorable settings and local contact IDs of {@link createScenicBasket}. */
export namespace createScenicBasket {
  /** The `kind` choices this producer admits. */
  export type Kind = "coilBasket" | "woodenFishBasket";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "inside" | "top";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > {
    /** A closed coil basket or an open fish basket. */
    kind: Kind;
  }

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = [
    "coilBasket",
    "woodenFishBasket",
  ];
}
