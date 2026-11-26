import { type AutoMovieArchetype } from "../core/index";
import { createPuttingGreen as createPuttingGreenImplementation } from "./internal/createPuttingGreen";
import { AutoMovieArchetypeUnits } from "../core";

/** Public operations for Auto Movie Archetype Putting Green. */
export namespace AutoMovieArchetypePuttingGreen {
  /**
   * A square putting green with its cup at the centre, the putting surface at Y =
   * 0 and the turf below it.
   *
   * The turf is sixteen convex sectors running from the cup's wall out to the
   * square's edge, so the cup is an open hole a rolling ball can fall into, with
   * a bottom at the rule's depth. `green` is the putting surface and `cup` the
   * hole's centre on it.
   *
   * @param params The model's id.
   * @param seed The seed that draws the green's side within its band; absent, the
   *   middle.
   * @returns The green.
   */
  export function create(params?: AutoMovieArchetypePuttingGreen.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypePuttingGreen.Affordance, "side"> {
    return createPuttingGreenImplementation(params, seed);
  }

  /** `green`, the putting surface at Y = 0; `cup`, the hole's centre on it. */
  export type Affordance = "green" | "cup";

  /** The parameters. */
  export interface IParams {
    /** The model's id, unique in a scene; `puttingGreen` when absent. */
    id?: string;
  }

  /** The hole's diameter, metres: Rules of Golf definition of Hole, 4.25 in. */
  export const CUP_DIAMETER: number = 4.25 * AutoMovieArchetypeUnits.INCH;

  /** The hole's depth, metres: Rules of Golf definition of Hole, at least 4 in. */
  export const CUP_DEPTH: number = 4 * AutoMovieArchetypeUnits.INCH;}
