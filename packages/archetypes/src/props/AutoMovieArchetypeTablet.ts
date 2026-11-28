import type { AutoMovieArchetype } from "../core";
import { HandheldDevice } from "./internal/HandheldDevice";

/**
 * Constructs an upright iPad-sized case with a front screen and full-height rear grasp.
 */
export namespace AutoMovieArchetypeTablet {
  /**
   * Build the tablet resting on its bottom edge with `screen` facing model `+Z`.
   *
   * Both catalogue configurations use a 179.5 by 248.6 by 7 millimetre body.
   * The rear grip is centred through the thickness and spans the full height.
   *
   * @param params Optional scene ID and model. The ID defaults to `device`.
   * @param seed Numeric seed for an omitted model. Omit it for `wifi`.
   * @returns The tablet slab and its rear `grip` and full-face `screen`.
   * @throws {AutoMovieArchetypeRefusal} If the catalogue model is unavailable.
   */
  export function create(
    params: AutoMovieArchetypeTablet.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeTablet.Affordance,
    AutoMovieArchetypeTablet.Dimension
  > {
    return HandheldDevice.fullFace("tablet", "tablet", params, seed, "screen");
  }

  /* The parameters and affordance identifiers of {@link AutoMovieArchetypeTablet}. */
  /** Wi-Fi and cellular configurations of the recorded 10th-generation iPad. */
  export type Model = "wifi" | "cellular";

  /**
   * Catalogue case width, height and thickness in metres, and configuration mass in kilograms.
   */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /**
   * Centred full-height rear `grip` and the front `screen` covering the case face.
   */
  export type Affordance = "grip" | "screen";

  /** Optional scene ID and Wi-Fi or cellular configuration. */
  export interface IParams extends Pick<HandheldDevice.IParams, "id"> {
    /**
     * Selects the dimension and mass record. Defaults to `wifi` without a seed.
     */
    model?: Model;
  }
}
