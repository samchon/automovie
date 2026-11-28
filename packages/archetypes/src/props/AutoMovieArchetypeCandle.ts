import type { AutoMovieArchetype } from "../core";
import { PracticalLightConstruction } from "./internal/PracticalLightConstruction";
import type { AutoMovieArchetypeLight } from "./AutoMovieArchetypeLight";

/** Constructs an upright candle with a precision hold and a wick socket. */
export namespace AutoMovieArchetypeCandle {
  /**
   * Build a cylindrical candle with its base at Y zero and wick toward `+Y`.
   *
   * The round `grip` lies halfway up the taper and faces `-Z`. The
   * upward `light` socket sits at the top of the candle.
   *
   * @param params Optional scene ID and finite length, diameter or mass
   *   within their bands. The ID defaults to `light`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   0.255 metres tall,
   *   0.022 metres in diameter and 0.0645 kilograms.
   * @returns The candle and its local taper grip and wick socket.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(
    params: AutoMovieArchetypeCandle.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeCandle.Affordance, AutoMovieArchetypeCandle.Dimension> {
    return PracticalLightConstruction.wick("candle", params, seed);
  }
  /**
   * Overall axial height and taper diameter in metres. Mass is in kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /** Round precision `grip` on the taper and upward `light` at wick height. */
  export type Affordance = "grip" | "light";

  /**
   * Optional scene ID, finite taper length and diameter in metres, and mass in kilograms.
   */
  export type IParams = Pick<
    AutoMovieArchetypeLight.IParams,
    "id" | "length" | "diameter" | "mass"
  >;
}
