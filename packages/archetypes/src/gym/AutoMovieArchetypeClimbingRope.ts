import { type AutoMovieArchetype } from "../core/index";
import { createClimbingRope as createClimbingRopeImplementation } from "./internal/createClimbingRope";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

/** Public operations for Auto Movie Archetype Climbing Rope. */
export namespace AutoMovieArchetypeClimbingRope {
  /**
   * A climbing rope hanging from an overhead anchor, as in a gym or from a
   * hovering helicopter's boom.
   *
   * It hangs above the origin along `+Y`, its anchor `anchor` metres up and its
   * free end `length` below that, a rope longer than its anchor is high lying no
   * lower than the floor. `line` is the rope's middle on its axis, its `+X` along
   * the rope pointing up to the anchor, with the rope's length and radius: a
   * climber grips and locks the feet anywhere along it, and a swinger hangs from
   * it about the anchor.
   *
   * @param params Any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The rope.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(params?: AutoMovieArchetypeClimbingRope.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeClimbingRope.Affordance,
  AutoMovieArchetypeClimbingRope.Dimension
> {
    return createClimbingRopeImplementation(params, seed);
  }

  /**
   * The affordance ids: `line`, the rope's middle on its axis, `+X` up the
   * rope.
   */
  export type Affordance = "line";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `anchor`: the anchor above the floor.
   * - `length`: the rope below the anchor, at most the anchor's height.
   * - `diameter`: the rope's thickness.
   * - `mass`: the rope's, kilograms.
   */
  export type Dimension = "anchor" | "length" | "diameter" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    anchor: "m",
    length: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `climbingRope` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    anchor: AutoMovieArchetypeBand.metres(
      4,
      12,
      "an estimate: a gym's beam to a helicopter boom over a fast-rope; no rigging sheet was read",
      true,
    ),
    length: AutoMovieArchetypeBand.metres(
      4,
      12,
      "an estimate: a gym climbing rope to a fast-rope; no rigging sheet was read",
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      0.03,
      0.045,
      "an estimate: a gym climbing rope to a fast-rope's thickness; no rigging sheet was read",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      3,
      15,
      "an estimate: a fibre rope of the lengths above at 0.6 to 1.2 kg a metre",
      true,
    ),
  };}
