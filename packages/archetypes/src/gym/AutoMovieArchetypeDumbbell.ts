import { type AutoMovieArchetype } from "../core/index";
import { createDumbbell as createDumbbellImplementation } from "./internal/createDumbbell";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

/** Public operations for Auto Movie Archetype Dumbbell. */
export namespace AutoMovieArchetypeDumbbell {
  /**
   * A dumbbell: a short handle with a steel head at each end, held in one hand.
   *
   * It lies along `X` with the handle's middle at the origin. Each head is a
   * solid steel cylinder as thick as its own radius times `SQUAT`, sized so the
   * two heads and the handle weigh the dumbbell's mass, so a heavier one is
   * larger. `grip` is the handle, taken from the `-Z` side.
   *
   * @param params The kind and any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The dumbbell.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(params: AutoMovieArchetypeDumbbell.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeDumbbell.Affordance, AutoMovieArchetypeDumbbell.Dimension> {
    return createDumbbellImplementation(params, seed);
  }

  /** The kinds of dumbbell. */
  export type Kind = "fixed";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["fixed"];

  /** A head's thickness in its own radii. An estimate, not read at a source. */
  export const SQUAT: number = 0.8;

  /**
   * The affordance ids: `grip`, the handle between the heads, taken from the
   * `-Z` side.
   */
  export type Affordance = "grip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `handle`: the handle's length between the heads.
   * - `diameter`: the handle's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "handle" | "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    handle: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which dumbbell; `fixed` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `dumbbell` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    fixed: {
      handle: AutoMovieArchetypeBand.metres(
        0.12,
        0.14,
        "an estimate: a handle a little longer than a hand's breadth; no maker's sheet was read",
        true,
      ),
      diameter: AutoMovieArchetypeBand.metres(
        0.028,
        0.034,
        "an estimate: from a barbell's 28 mm grip to a thick rubber dumbbell's handle; no maker's sheet was read",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1,
        40,
        "an estimate of the range a gym's rack carries; no maker's sheet was read",
        true,
      ),
    },
  };}
