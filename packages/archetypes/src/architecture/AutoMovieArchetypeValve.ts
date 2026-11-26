import { type AutoMovieArchetype } from "../core/index";
import { createValve as createValveImplementation } from "./internal/createValve";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

/** Public operations for Auto Movie Archetype Valve. */
export namespace AutoMovieArchetypeValve {
  /**
   * A gate valve on a pipe, opened and closed by its handwheel.
   *
   * The pipe runs along `X` lying on the floor, its axis a bore's radius up over
   * the origin; the valve's bonnet and stem rise along `+Y` to the handwheel,
   * which lies level at the valve's height open above the pipe's axis. It is one
   * of the maker's two valves read, whole: the model given, or one drawn from the
   * seed. `wheel` is the handwheel, a wheel turned about `+Y`; it states no
   * travel, since no source read gives its turns from open to closed.
   *
   * It rests on its iron pipe: steel on concrete (`AutoMovieArchetypeFriction`).
   *
   * @param params The model and any dimension the author fixes.
   * @param seed The seed that draws the model when it is not given and every
   *   dimension left free inside its band; absent, the first model and the middle
   *   of each band.
   * @returns The valve.
   * @throws {AutoMovieArchetypeRefusal} For a model the sheet does not list, or a
   *   fixed dimension outside its band.
   */
  export function create(params?: AutoMovieArchetypeValve.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeValve.Affordance, AutoMovieArchetypeValve.Dimension> {
    return createValveImplementation(params, seed);
  }

  /** The valves read: NIBCO F-617-ON's 4 in and 6 in. */
  export type Model = "4in" | "6in";

  /**
   * Each valve's figures, metres, the default first: NIBCO F-617-ON class 125
   * iron gate valve sheet, the 4 in (100 mm) valve 24.00 in (610 mm) high open
   * with a 10 in (254 mm) handwheel, the 6 in (150 mm) valve 31.06 in (789 mm)
   * high open with a 12 in (305 mm) handwheel, the handwheel the drawing's
   * dimension C (https://cdn.bath1.com/pdf/nibco/FT617ONBI.pdf).
   */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "4in": { bore: 0.1, height: 0.61, wheel: 0.254 },
    "6in": { bore: 0.15, height: 0.789, wheel: 0.305 },
  };

  /** The affordance id: `wheel`, the handwheel turned about `+Y`. */
  export type Affordance = "wheel";

  /**
   * The dimensions, metres unless stated:
   *
   * - `bore`: the pipe's nominal bore, its model's.
   * - `height`: the valve's height open above the pipe's axis, its model's.
   * - `wheel`: the handwheel's diameter, its model's.
   * - `mass`: kilograms, free.
   */
  export type Dimension = "bore" | "height" | "wheel" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    bore: "m",
    height: "m",
    wheel: "m",
    mass: "kg",
  };

  /**
   * The parameters: the model, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<"mass", number>> {
    /** Which valve; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `valve` when absent. */
    id?: string;
  }

  /** The band of the free dimension. */
  export const BANDS: Readonly<Record<"mass", IAutoMovieArchetypeBand>> = {
    mass: AutoMovieArchetypeBand.of(
      "kg",
      40,
      90,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };}
