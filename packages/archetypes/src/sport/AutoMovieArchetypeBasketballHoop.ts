import { type AutoMovieArchetype } from "../core/index";
import { createBasketballHoop as createBasketballHoopImplementation } from "./internal/createBasketballHoop";
import { type createGoal } from "./createGoal";

/** Public operations for Auto Movie Archetype Basketball Hoop. */
export namespace AutoMovieArchetypeBasketballHoop {
  /**
   * A basketball hoop with a rim bar and backboard surface.
   *
   * The backboard faces +Z at the goal plane and the rim projects toward the
   * court. Mount the board on a wall or stand in the scene.
   *
   * @param params The optional identifier and dimensions fixed within their
   *   recorded bands.
   * @param seed The seed for free dimensions. The band midpoints apply without a
   *   seed.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(params?: AutoMovieArchetypeBasketballHoop.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeBasketballHoop.Affordance,
  AutoMovieArchetypeBasketballHoop.Dimension
> {
    return createBasketballHoopImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "bar"
    | "board"
    | "height"
    | "mass"
    | "offset"
    | "ring"
    | "thickness"
    | "width";

  /** The contact identifiers for the apparatus. */
  export type Affordance = "board" | "rim";

  /** The identifier and overrides that apply to this profile. */
  export type IParams = Pick<
    createGoal.IParams,
    | "id"
    | "width"
    | "board"
    | "thickness"
    | "height"
    | "ring"
    | "bar"
    | "offset"
    | "mass"
  >;}
