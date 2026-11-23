import type { AutoMovieArchetype } from "../core";
import { VesselConstruction } from "./VesselConstruction";
import type { createVessel } from "./createVessel";

/**
 * A bowl with an open interior and a bottom grip for both hands.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createBowl(
  params: createBowl.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createBowl.Affordance, createBowl.Dimension> {
  return VesselConstruction.bowl(params, seed);
}

/** The authorable settings and local contact IDs of {@link createBowl}. */
export namespace createBowl {
  /** The `model` choices this producer admits. */
  export type Model = "ikea365" | "sunnyDay18" | "sunnyDayCereal";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** The contact IDs declared by this producer. */
  export type Affordance = "body" | "inside" | "rim";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<createVessel.IParams, "id"> {
    /** The recorded bowl. The seed selects it when omitted. */
    model?: Model;
  }
}
