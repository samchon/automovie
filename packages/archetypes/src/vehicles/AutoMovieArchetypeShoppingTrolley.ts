import type { AutoMovieArchetype } from "../core";
import type { createCart } from "./createCart";
import { createShoppingTrolley } from "./cart/createShoppingTrolley";

/** Canonical producer and authoring contract for Shopping Trolley. */
export namespace AutoMovieArchetypeShoppingTrolley {
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
  export function create(
    params: AutoMovieArchetypeShoppingTrolley.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeShoppingTrolley.Affordance,
    AutoMovieArchetypeShoppingTrolley.Dimension
  > {
    return createShoppingTrolley(params, seed);
  }

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
