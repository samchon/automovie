import type { AutoMovieArchetype } from "../core";
import { VesselConstruction } from "./internal/VesselConstruction";
import type { AutoMovieArchetypeVessel } from "./AutoMovieArchetypeVessel";

/**
 * Constructs an upright glass vase with a body grasp and supported interior.
 */
export namespace AutoMovieArchetypeVase {
  /**
   * Build an open glass vase with its bottom at model Y zero.
   *
   * The round `body` grip faces `-X` at half height. Both opening
   * `rim` and the supported inside floor point toward `+Y`.
   *
   * @param params Optional scene ID and finite outside span and height
   *   in metres or mass in kilograms. The ID defaults to `vessel`.
   * @param seed Numeric seed for omitted values. The seedless vase is
   *   0.1375 metres across and 0.3 metres high.
   * @returns The glass vase with opening, floor surface and mid-body grasp.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(
    params: AutoMovieArchetypeVase.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeVase.Affordance, AutoMovieArchetypeVase.Dimension> {
    return VesselConstruction.vase(params, seed);
  }
  /**
   * Outside width and rim height in metres, and recorded packed mass in kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** Upward `rim` and floor `inside`, plus a lateral mid-body `body` grasp. */
  export type Affordance = "body" | "inside" | "rim";

  /**
   * Optional scene ID and finite width, height or mass admitted by the vase bands.
   */
  export type IParams = Pick<
    AutoMovieArchetypeVessel.IParams,
    "id" | "diameter" | "height" | "mass"
  >;
}
