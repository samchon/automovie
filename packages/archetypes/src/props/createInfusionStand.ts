import type { AutoMovieArchetype } from "../core";
import { MobilityAidConstruction } from "./MobilityAidConstruction";
import type { createMobilityAid } from "./createMobilityAid";

/**
 * A mobile infusion stand with a tube grip and a top bag hook.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createInfusionStand(
  params: createInfusionStand.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createInfusionStand.Affordance,
  createInfusionStand.Dimension
> {
  return MobilityAidConstruction.infusionStand(params, seed);
}

/** The authorable settings and local contact IDs of {@link createInfusionStand}. */
export namespace createInfusionStand {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "hook" | "tip";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createMobilityAid.IParams,
    "id" | "height" | "diameter" | "width" | "mass"
  >;
}
