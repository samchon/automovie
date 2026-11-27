import { type AutoMovieArchetype } from "../core/index";
import { createTightrope as createTightropeImplementation } from "./internal/createTightrope";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

/** Public operations for Auto Movie Archetype Tightrope. */
export namespace AutoMovieArchetypeTightrope {
  /**
   * A tightrope or slackline: a wire stretched level between two anchor posts.
   *
   * It stands on the floor with the middle of its span at the origin, the wire
   * along `X`. `bar` is the wire's middle, on its axis, `+Y` up: a walker stands
   * on it anywhere along its length (`lineWalk`, which also takes the sag its
   * load gives it).
   *
   * @param params Any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The rope.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(params?: AutoMovieArchetypeTightrope.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeTightrope.Affordance, AutoMovieArchetypeTightrope.Dimension> {
    return createTightropeImplementation(params, seed);
  }

  /** A post's radius, metres. An estimate, not read at a source. */
  export const POST: number = 0.06;

  /**
   * The affordance ids: `bar`, the wire's middle on its axis, `+Y` up, stood on
   * from above.
   */
  export type Affordance = "bar";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the wire above the floor.
   * - `span`: between the anchors.
   * - `diameter`: the wire's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "span" | "diameter" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    span: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `tightrope` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      0.3,
      3,
      "an estimate: from a park slackline to a circus low wire; no rigging sheet was read",
      true,
    ),
    span: AutoMovieArchetypeBand.metres(
      3,
      30,
      "an estimate: a training wire to a long slackline; no rigging sheet was read",
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      0.012,
      0.025,
      "an estimate: a walking cable's thickness, or a flat line's width; no rigging sheet was read",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      20,
      200,
      "an estimate, posts included",
      true,
    ),
  };}
