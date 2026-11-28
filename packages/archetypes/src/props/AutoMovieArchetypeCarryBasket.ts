import { type AutoMovieArchetype } from "../core/index";
import { createCarryBasket as createCarryBasketImplementation } from "./internal/createCarryBasket";
import { type AutoMovieArchetypeTray } from "./AutoMovieArchetypeTray";

/**
 * Constructs a RISATORP basket proxy with an inner floor and a raised carrying bar.
 */
export namespace AutoMovieArchetypeCarryBasket {
  /**
   * Build the selected carry basket with its base at model Y zero.
   *
   * The `inside` rectangle lies on the floor below the walls. The
   * `handle` bar runs along Z, 0.12 metres above the rim.
   *
   * @param params Optional scene ID, catalogue size and finite mass
   *   admitted by the basket band. The default ID is `tray`.
   * @param seed Numeric seed for omitted values. Omit it to select
   *   `risatorp25`, a 0.25 by 0.26 by 0.18 metre basket body.
   * @returns The open basket with its supported floor and carrying bar.
   * @throws {AutoMovieArchetypeRefusal} If the model or fixed mass is inadmissible.
   */
  export function create(params?: AutoMovieArchetypeCarryBasket.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeCarryBasket.Affordance,
  AutoMovieArchetypeCarryBasket.Dimension
> {
    return createCarryBasketImplementation(params, seed);
  }

  /**
   * The two recorded basket bodies, `risatorp25` and `risatorp42` by their width in centimetres.
   */
  export type Model = "risatorp25" | "risatorp42";

  /**
   * Outer body width, depth and rim height in metres, and mass in kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** Supported inner `inside` floor and raised `handle` along model Z. */
  export type Affordance = "handle" | "inside";

  /**
   * Optional scene ID, catalogue body choice and finite mass in the basket band.
   */
  export interface IParams extends Pick<AutoMovieArchetypeTray.IParams, "id" | "mass"> {
    /**
     * Selects the correlated basket body sizes. Omit the model and seed for `risatorp25`.
     */
    model?: Model;
  }}
