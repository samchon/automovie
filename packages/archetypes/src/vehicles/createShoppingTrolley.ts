import { type AutoMovieArchetype } from "../core";
import { CartConstruction } from "./CartConstruction";
import { CartPushed } from "./CartPushed";
import type { createCart } from "./createCart";

/**
 * Shopping trolley.
 *
 * A four-castor basket carrier pushed from the rear bar at −Z. The basket floor
 * supports upright cargo.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createShoppingTrolley(
  params: createShoppingTrolley.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createShoppingTrolley.Affordance,
  createShoppingTrolley.Dimension
> {
  return CartConstruction("trolley", params, seed, CartPushed.trolley);
}

/** Authoring options for {@link createShoppingTrolley}. */
export namespace createShoppingTrolley {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "gripDiameter"
    | "handleHeight"
    | "handleSpacing"
    | "length"
    | "mass"
    | "wheelDiameter"
    | "width";

  /**
   * The createCart contact set its shared construction types. This producer
   * builds handle, load.
   */
  export type Affordance = createCart.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createCart.IParams,
    | "id"
    | "length"
    | "width"
    | "handleHeight"
    | "handleSpacing"
    | "gripDiameter"
    | "mass"
  > {
    /**
     * The trolley's rear and front castor diameter, selected from the
     * catalogue.
     */
    castor?: createCart.Castor;
  }
}
