import { type AutoMovieArchetype } from "../core/index";
import { createScenicBasket as createScenicBasketImplementation } from "./internal/createScenicBasket";
import { type createScenicContainer } from "./internal/createScenicContainer";

/** Constructs a lidded coil basket or an open, flared fish basket. */
export namespace AutoMovieArchetypeScenicBasket {
  /**
   * Build a coil or fish basket with its lower face at model Y zero.
   *
   * The coil basket's tapered lid carries `top`. The fish basket's
   * panels flare around a clear cavity, with `inside` on the smaller floor.
   *
   * @param params Required basket kind, optional scene ID and finite
   *   dimensions in the selected bands. The default ID is `scenicContainer`.
   * @param seed Numeric seed for omitted values. Seedless outer sizes
   *   are 0.32 by 0.32 by 0.21 metres for the coil basket and 0.51 by
   *   0.395 by 0.455 metres for the fish basket, in X/Z/Y order.
   * @returns The basket with the supported footprint for its form.
   * @throws {AutoMovieArchetypeRefusal} If the kind or fixed value is inadmissible.
   */
  export function create(params: AutoMovieArchetypeScenicBasket.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeScenicBasket.Affordance,
  AutoMovieArchetypeScenicBasket.Dimension
> {
    return createScenicBasketImplementation(params, seed);
  }

  /** Selects a closed `coilBasket` with a lid or an open `woodenFishBasket`. */
  export type Kind = "coilBasket" | "woodenFishBasket";

  /**
   * Exterior X width, Z depth and Y height in metres, and mass in kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /**
   * Supported lid `top` for a coil basket or the inner floor `inside` for a fish basket.
   */
  export type Affordance = "inside" | "top";

  /**
   * Required basket kind, optional scene ID and finite measurements admitted by that kind's bands.
   */
  export interface IParams extends Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > {
    /** Chooses the lidded or open shape and its supported placement site. */
    kind: Kind;
  }

  /** The two basket shapes in coil then fish order. */
  export const KINDS: readonly IParams["kind"][] = [
    "coilBasket",
    "woodenFishBasket",
  ];}
