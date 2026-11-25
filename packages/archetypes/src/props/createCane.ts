import type { AutoMovieArchetype } from "../core";
import { MobilityAidConstruction } from "./MobilityAidConstruction";
import type { createMobilityAid } from "./createMobilityAid";

/**
 * An offset walking cane with a handle over its shaft and a downward floor tip.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createCane(
  params: createCane.IParams = {},
  seed?: number,
): AutoMovieArchetype<createCane.Affordance, createCane.Dimension> {
  return MobilityAidConstruction.cane(params, seed);
}

/** The authorable settings and local contact IDs of {@link createCane}. */
export namespace createCane {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "tip";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createMobilityAid.IParams,
    "id" | "height" | "diameter" | "mass"
  >;
}
