import { type AutoMovieArchetype } from "../core/index";
import { createRack as createRackImplementation } from "./internal/createRack";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

/** Public operations for Auto Movie Archetype Rack. */
export namespace AutoMovieArchetypeRack {
  /**
   * A squat rack: two uprights, each with a hook a barbell rests on.
   *
   * It stands on the floor with the middle of its footprint at the origin, the
   * uprights on either side of `X`, the hooks reaching toward `-Z`, where the
   * lifter stands. `rest` is the place between the two hooks where the bar's
   * middle lies, on the bar's axis, with `+Y` up.
   *
   * @param params The kind and any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The rack.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(params: AutoMovieArchetypeRack.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeRack.Affordance, AutoMovieArchetypeRack.Dimension> {
    return createRackImplementation(params, seed);
  }

  /** The kinds of rack. */
  export type Kind = "squat";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["squat"];

  /** An upright's square section, metres. An estimate, not read at a source. */
  export const POST: number = 0.06;

  /**
   * A hook's reach before its upright, metres. An estimate, not read at a
   * source.
   */
  export const HOOK: number = 0.08;

  /** A hook's thickness, metres. An estimate, not read at a source. */
  export const LIP: number = 0.02;

  /**
   * How far a resting bar's axis lies above the hook's top, metres: half a 28
   * mm bar.
   */
  export const SEAT: number = 0.014;

  /**
   * The affordance ids: `rest`, where a bar laid on both hooks has its middle,
   * on the bar's axis, `+Y` up.
   */
  export type Affordance = "rest";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the uprights'.
   * - `width`: between the uprights' middles.
   * - `rest`: a resting bar's axis above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "width" | "rest" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    width: "m",
    rest: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which rack; `squat` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `rack` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    squat: {
      height: AutoMovieArchetypeBand.metres(
        1.8,
        2.3,
        "an estimate; no maker's sheet was read",
        true,
      ),
      width: AutoMovieArchetypeBand.metres(
        1.05,
        1.2,
        "an estimate: inside a barbell's 1.31 m between collars; no maker's sheet was read",
        true,
      ),
      rest: AutoMovieArchetypeBand.metres(
        0.9,
        1.6,
        "an estimate: from a bench press's rest to a tall lifter's shoulders; no maker's sheet was read",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        30,
        80,
        "an estimate; no maker's sheet was read",
        true,
      ),
    },
  };}
