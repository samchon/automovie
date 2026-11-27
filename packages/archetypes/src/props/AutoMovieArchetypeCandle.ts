import type { AutoMovieArchetype } from "../core";
import { PracticalLightConstruction } from "./PracticalLightConstruction";
import type { createLight } from "./createLight";

/** Canonical producer and authoring contract for Candle. */
export namespace AutoMovieArchetypeCandle {
  /**
   * A candle with a precision grasp on its taper and a light frame at its top.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(
    params: AutoMovieArchetypeCandle.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeCandle.Affordance, AutoMovieArchetypeCandle.Dimension> {
    return PracticalLightConstruction.wick("candle", params, seed);
  }
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "light";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createLight.IParams,
    "id" | "length" | "diameter" | "mass"
  >;
}
