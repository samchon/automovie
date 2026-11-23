import type { AutoMovieArchetype } from "../core";
import { MobilityAidConstruction } from "./MobilityAidConstruction";
import type { createMobilityAid } from "./createMobilityAid";

/**
 * A four-legged walking frame with a paired hand-grip and a central floor
 * reference.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createWalker(
  params: createWalker.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createWalker.Affordance, createWalker.Dimension> {
  return MobilityAidConstruction.walker(params, seed);
}

/** The authorable settings and local contact IDs of {@link createWalker}. */
export namespace createWalker {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "diameter" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "leftGrip" | "rightGrip" | "tip";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createMobilityAid.IParams,
    "id" | "height" | "diameter" | "width" | "depth" | "model"
  >;
}
