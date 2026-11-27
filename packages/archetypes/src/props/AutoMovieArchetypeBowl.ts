import type { AutoMovieArchetype } from "../core";
import { VesselConstruction } from "./internal/VesselConstruction";
import type { AutoMovieArchetypeVessel } from "./AutoMovieArchetypeVessel";

/** Canonical producer and authoring contract for Bowl. */
export namespace AutoMovieArchetypeBowl {
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
  export function create(
    params: AutoMovieArchetypeBowl.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeBowl.Affordance, AutoMovieArchetypeBowl.Dimension> {
    return VesselConstruction.bowl(params, seed);
  }
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
  export interface IParams extends Pick<AutoMovieArchetypeVessel.IParams, "id"> {
    /** The recorded bowl. The seed selects it when omitted. */
    model?: Model;
  }
}
