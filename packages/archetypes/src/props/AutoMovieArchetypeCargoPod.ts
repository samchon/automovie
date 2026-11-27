import type { AutoMovieArchetype } from "../core";
import { ScenicContainerConstruction } from "./ScenicContainerConstruction";
import type { createScenicContainer } from "./createScenicContainer";

/** A cargo pod with a mounting socket and a stacking footprint. */
export namespace AutoMovieArchetypeCargoPod {
  /**
 * A faceted cargo pod with a lower mounting socket and an upper stacking
 * footprint.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
  export function create(
  params: AutoMovieArchetypeCargoPod.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCargoPod.Affordance, AutoMovieArchetypeCargoPod.Dimension> {
  return ScenicContainerConstruction.mountedPod(params, seed);
  }
}

/** The authorable settings and local contact IDs of {@link AutoMovieArchetypeCargoPod}. */
export namespace AutoMovieArchetypeCargoPod {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "mount" | "top";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;
}
