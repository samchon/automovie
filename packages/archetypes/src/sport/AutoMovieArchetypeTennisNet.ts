import { type AutoMovieArchetype } from "../core/index";
import { createTennisNet as createTennisNetImplementation } from "./internal/createTennisNet";
import { type createGoal } from "./createGoal";

/** Public operations for Auto Movie Archetype Tennis Net. */
export namespace AutoMovieArchetypeTennisNet {
  /**
   * A tennis net with centre strap, sagging cord and post grips.
   *
   * The net spans the XY plane, with the top ledge at the centre strap and the
   * square posts outside the doubles court.
   *
   * @param params The optional identifier and dimensions fixed within their
   *   recorded bands.
   * @param seed The seed for free dimensions. The band midpoints apply without a
   *   seed.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(params?: AutoMovieArchetypeTennisNet.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeTennisNet.Affordance, AutoMovieArchetypeTennisNet.Dimension> {
    return createTennisNetImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "bar"
    | "height"
    | "mass"
    | "offset"
    | "post"
    | "width";

  /** The contact identifiers for the apparatus. */
  export type Affordance = "leftPost" | "rightPost" | "top";

  /** The identifier and overrides that apply to this profile. */
  export type IParams = Pick<
    createGoal.IParams,
    "id" | "width" | "height" | "post" | "offset" | "bar" | "mass"
  >;}
