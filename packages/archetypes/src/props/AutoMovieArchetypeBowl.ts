import type { AutoMovieArchetype } from "../core";
import { VesselConstruction } from "./internal/VesselConstruction";
import type { AutoMovieArchetypeVessel } from "./AutoMovieArchetypeVessel";

/**
 * Constructs a ceramic model bowl with a supported interior and underside grip.
 */
export namespace AutoMovieArchetypeBowl {
  /**
   * Build an open ceramic bowl resting on its floor at model Y zero.
   *
   * The upward `rim` is the opening height. The `inside` rectangle lies
   * on the round floor, and the two-hand `body` grips from underneath.
   *
   * @param params Optional scene ID and a complete bowl catalogue model.
   *   The default ID is `vessel`.
   * @param seed Numeric seed for an omitted model. Omit it for `ikea365`,
   *   0.16 metres across and 0.07 metres high, with a provisional packed mass.
   * @returns The bowl with rim, supported inside surface and underside grip.
   * @throws {AutoMovieArchetypeRefusal} If the model is unavailable.
   */
  export function create(
    params: AutoMovieArchetypeBowl.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeBowl.Affordance, AutoMovieArchetypeBowl.Dimension> {
    return VesselConstruction.bowl(params, seed);
  }
  /** Recorded bowl labels `ikea365`, `sunnyDay18` and `sunnyDayCereal`. */
  export type Model = "ikea365" | "sunnyDay18" | "sunnyDayCereal";

  /**
   * Recorded outside span and rim height in metres, and model mass in kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /**
   * Upward `rim` and supported `inside`, plus a two-hand underside `body` grip.
   */
  export type Affordance = "body" | "inside" | "rim";

  /** Optional scene ID and a complete recorded bowl model. */
  export interface IParams extends Pick<AutoMovieArchetypeVessel.IParams, "id"> {
    /**
     * Selects one IKEA or Thomas bowl. Omit the model and seed for `ikea365`.
     */
    model?: Model;
  }
}
