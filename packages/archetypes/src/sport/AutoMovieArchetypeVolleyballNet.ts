import { type AutoMovieArchetype } from "../core/index";
import { createVolleyballNet as createVolleyballNetImplementation } from "./internal/createVolleyballNet";
import { type AutoMovieArchetypeGoal } from "./AutoMovieArchetypeGoal";

/** Public operations for Auto Movie Archetype Volleyball Net. */
export namespace AutoMovieArchetypeVolleyballNet {
  /**
   * A volleyball net with class-specific height, side antennas and post grips.
   *
   * The net extends along X. Top marks its upper edge and its two posts stand on
   * the floor.
   *
   * @param params The identifier, net class and optional dimensions. The class
   *   supplies the top height.
   * @param seed The seed draws the class and free dimensions. Without a seed, the
   *   men's class and band midpoints apply.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(params?: AutoMovieArchetypeVolleyballNet.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeVolleyballNet.Affordance,
  AutoMovieArchetypeVolleyballNet.Dimension
> {
    return createVolleyballNetImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "board"
    | "height"
    | "mass"
    | "offset"
    | "post"
    | "width";

  /** The contact identifiers for the apparatus. */
  export type Affordance = "leftPost" | "rightPost" | "top";

  /** The identifier and overrides that apply to this profile. */
  export type IParams = Pick<
    AutoMovieArchetypeGoal.IParams,
    "id" | "width" | "board" | "offset" | "post" | "mass" | "net"
  >;}
