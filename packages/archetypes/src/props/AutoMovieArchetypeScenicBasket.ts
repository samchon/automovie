import { type AutoMovieArchetype } from "../core/index";
import { createScenicBasket as createScenicBasketImplementation } from "./internal/createScenicBasket";
import { type createScenicContainer } from "./internal/createScenicContainer";

/** Public operations for Auto Movie Archetype Scenic Basket. */
export namespace AutoMovieArchetypeScenicBasket {
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
  export function create(params: AutoMovieArchetypeScenicBasket.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeScenicBasket.Affordance,
  AutoMovieArchetypeScenicBasket.Dimension
> {
    return createScenicBasketImplementation(params, seed);
  }

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
  ];}
