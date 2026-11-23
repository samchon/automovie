import type { AutoMovieArchetype } from "../core";
import { TrayConstruction } from "./TrayConstruction";
import type { createTray } from "./createTray";

/**
 * A carry basket with an open floor and a raised bar grip.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createCarryBasket(
  params: createCarryBasket.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createCarryBasket.Affordance,
  createCarryBasket.Dimension
> {
  return TrayConstruction.basket(params, seed);
}

/** The authorable settings and local contact IDs of {@link createCarryBasket}. */
export namespace createCarryBasket {
  /** The `model` choices this producer admits. */
  export type Model = "risatorp25" | "risatorp42";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "handle" | "inside";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<createTray.IParams, "id" | "mass"> {
    /** The recorded basket model. The seed selects it when omitted. */
    model?: Model;
  }
}
