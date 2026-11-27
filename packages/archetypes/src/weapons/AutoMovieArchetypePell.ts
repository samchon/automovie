import { type AutoMovieArchetype } from "../core/index";
import { createPell as createPellImplementation } from "./internal/createPell";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

/** Public operations for Auto Movie Archetype Pell. */
export namespace AutoMovieArchetypePell {
  /**
   * A pell: the upright post a swordsman strikes in solo drill.
   *
   * The post stands on the ground at the origin. `target` is its `+Z` side, the
   * face a drill's cuts and thrusts are aimed at, as wide as the post and as
   * high; a site on it names a height, so a cut to the head and a cut to the leg
   * are two sites of one contact. `top` is the post's upper end.
   *
   * @param params Any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The pell.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(params?: AutoMovieArchetypePell.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypePell.Affordance, AutoMovieArchetypePell.Dimension> {
    return createPellImplementation(params, seed);
  }

  /**
   * The affordance ids:
   *
   * - `target`: the post's `+Z` side, facing the striker; its width is the post's
   *   thickness and its depth the post's height.
   * - `top`: the upper end, facing up.
   */
  export type Affordance = "target" | "top";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the post above the ground.
   * - `diameter`: the post's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `pell` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      1.83,
      1.83,
      "a post standing six feet above the ground, Vegetius, De Re Militari I.11, recalled and not read at a source",
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      0.15,
      0.25,
      "a post about as thick as a man's trunk is wide, not read at a source",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      23,
      63,
      "an oak post of these sizes at about 700 kg per cubic metre, not read at a source",
      true,
    ),
  };}
