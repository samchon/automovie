import { type AutoMovieArchetype } from "../core/index";
import { createCrib as createCribImplementation } from "./internal/createCrib";
import { type AutoMovieArchetypeBed } from "./AutoMovieArchetypeBed";

/**
 * Constructs an enclosed crib with a mattress surface and graspable side rails.
 */
export namespace AutoMovieArchetypeCrib {
  /**
   * Build a crib with an enclosed mattress, posts and side and end slats.
   *
   * @param params Optional ID and fixed crib dimensions within their bands.
   *   The ID defaults to `bed`.
   * @param seed Numeric seed for omitted settings. Without it the interior
   *   is 28 by 52.375 inches and the mattress top is 0.381 metres high.
   * @returns The mattress `surface` and two side-bar grasp frames.
   * @throws {AutoMovieArchetypeRefusal} If a fixed dimension is inadmissible.
   */
  export function create(params?: AutoMovieArchetypeCrib.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeCrib.Affordance, AutoMovieArchetypeCrib.Dimension> {
    return createCribImplementation(params, seed);
  }

  /**
   * Interior width and length, rail top height, support-to-rail distance and mattress thickness in metres, plus mass in kilograms.
   */
  export type Dimension =
    | "height"
    | "length"
    | "mass"
    | "rail"
    | "thickness"
    | "width";

  /**
   * The mattress `surface` and the `leftRail` and `rightRail` bar centrelines on opposite sides.
   */
  export type Affordance = "leftRail" | "rightRail" | "surface";

  /**
   * Optional scene ID and fixed crib values in the admitted interior, frame, thickness and mass bands.
   */
  export type IParams = Pick<
    AutoMovieArchetypeBed.IParams,
    "id" | "width" | "length" | "height" | "rail" | "thickness" | "mass"
  >;}
