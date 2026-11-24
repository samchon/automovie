import type { AutoMovieArchetype } from "../core";
import { VesselConstruction } from "./VesselConstruction";
import type { createVessel } from "./createVessel";

/**
 * An upright vase with an open interior and a grip around its body.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createVase(
  params: createVase.IParams = {},
  seed?: number,
): AutoMovieArchetype<createVase.Affordance, createVase.Dimension> {
  return VesselConstruction.vase(params, seed);
}

/** The authorable settings and local contact IDs of {@link createVase}. */
export namespace createVase {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** The contact IDs declared by this producer. */
  export type Affordance = "body" | "inside" | "rim";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createVessel.IParams,
    "id" | "diameter" | "height" | "mass"
  >;
}
