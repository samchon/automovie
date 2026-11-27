import { type AutoMovieArchetype } from "../core/index";
import { createWalker as createWalkerImplementation } from "./internal/createWalker";
import { type AutoMovieArchetypeMobilityAid } from "./AutoMovieArchetypeMobilityAid";

/** Public operations for Auto Movie Archetype Walker. */
export namespace AutoMovieArchetypeWalker {
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
  export function create(params?: AutoMovieArchetypeWalker.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeWalker.Affordance, AutoMovieArchetypeWalker.Dimension> {
    return createWalkerImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "diameter" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "leftGrip" | "rightGrip" | "tip";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    AutoMovieArchetypeMobilityAid.IParams,
    "id" | "height" | "diameter" | "width" | "depth" | "model"
  >;}
