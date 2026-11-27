import { type AutoMovieArchetype } from "../core/index";
import { createCrib as createCribImplementation } from "./internal/createCrib";
import { type AutoMovieArchetypeBed } from "./AutoMovieArchetypeBed";

/** Public operations for Auto Movie Archetype Crib. */
export namespace AutoMovieArchetypeCrib {
  /**
   * A crib with a surrounding slat frame and grasp bars on both sides.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params?: AutoMovieArchetypeCrib.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeCrib.Affordance, AutoMovieArchetypeCrib.Dimension> {
    return createCribImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "height"
    | "length"
    | "mass"
    | "rail"
    | "thickness"
    | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "leftRail" | "rightRail" | "surface";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    AutoMovieArchetypeBed.IParams,
    "id" | "width" | "length" | "height" | "rail" | "thickness" | "mass"
  >;}
