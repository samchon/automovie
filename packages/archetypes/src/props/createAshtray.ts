import type { AutoMovieArchetype } from "../core";
import { VesselConstruction } from "./VesselConstruction";
import type { createVessel } from "./createVessel";

/**
 * An ashtray with an inside floor and a precision grip from beneath.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createAshtray(
  params: createAshtray.IParams = {},
  seed?: number,
): AutoMovieArchetype<createAshtray.Affordance, createAshtray.Dimension> {
  return VesselConstruction.ashtray(params, seed);
}

/** The authorable settings and local contact IDs of {@link createAshtray}. */
export namespace createAshtray {
  /** The `model` choices this producer admits. */
  export type Model = "nachtmann" | "harris";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** The contact IDs declared by this producer. */
  export type Affordance = "body" | "inside" | "rim";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<createVessel.IParams, "id"> {
    /** The recorded ashtray. The seed selects it when omitted. */
    model?: Model;
  }
}
