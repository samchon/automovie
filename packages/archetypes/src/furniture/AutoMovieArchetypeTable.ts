import { type AutoMovieArchetype } from "../core/index";
import { createTable as createTableImplementation } from "./internal/createTable";
import { AutoMovieArchetypeUnits, AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand } from "../core";
import { TABLE_BANDS } from "./constants/TABLE_BANDS";

/** Public operations for Auto Movie Archetype Table. */
export namespace AutoMovieArchetypeTable {
  /**
   * A table: a dining table, a desk, a counter, a coffee table, a raised bar
   * counter, a service counter, a workbench, a pupil desk or an altar.
   *
   * The model is a top on four legs, on a solid base for a counter, a bar counter
   * and a service counter, or on two pedestals for an altar. The top is centred
   * over the origin with its length along `+X`; the `+Z` edge is the front, where
   * a person sits or stands at it.
   *
   * @param params The kind, a service counter's or a pupil desk's listed size,
   *   and any dimension the author fixes.
   * @param seed The seed that picks a listed size when none is given and draws
   *   every dimension left free inside its band; absent, the first size and the
   *   middle of each band.
   * @returns The table.
   * @throws {AutoMovieArchetypeRefusal} For a size the kind does not list, or a
   *   fixed dimension outside its band.
   */
  export function create(params: AutoMovieArchetypeTable.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeTable.Affordance, AutoMovieArchetypeTable.Dimension> {
    return createTableImplementation(params, seed);
  }

  /** The kinds of table. */
  export type Kind =
    | "dining"
    | "desk"
    | "counter"
    | "coffee"
    | "bar"
    | "serviceCounter"
    | "workbench"
    | "pupilDesk"
    | "altar";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "dining",
    "desk",
    "counter",
    "coffee",
    "bar",
    "serviceCounter",
    "workbench",
    "pupilDesk",
    "altar",
  ];

  /**
   * The sizes a sheet lists in steps: a service counter's lengths (`length30`,
   * `length36`, `length50`, Delfield's 30, 36 and 50 in) and a pupil desk's
   * heights (`height19` to `height31`, Smith System's 19 to 31 in in 1 in
   * steps).
   */
  export type Size =
    | "length30"
    | "length36"
    | "length50"
    | "height19"
    | "height20"
    | "height21"
    | "height22"
    | "height23"
    | "height24"
    | "height25"
    | "height26"
    | "height27"
    | "height28"
    | "height29"
    | "height30"
    | "height31";

  /**
   * Each kind's listed sizes, the default first, each with the dimension it
   * fixes, metres; a kind not listed has none.
   */
  export const SIZES: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<
          Partial<Record<Size, Readonly<Partial<Record<Dimension, number>>>>>
        >
      >
    >
  > = {
    serviceCounter: {
      length30: { length: 30 * AutoMovieArchetypeUnits.INCH },
      length36: { length: 36 * AutoMovieArchetypeUnits.INCH },
      length50: { length: 50 * AutoMovieArchetypeUnits.INCH },
    },
    pupilDesk: {
      height19: { height: 19 * AutoMovieArchetypeUnits.INCH },
      height20: { height: 20 * AutoMovieArchetypeUnits.INCH },
      height21: { height: 21 * AutoMovieArchetypeUnits.INCH },
      height22: { height: 22 * AutoMovieArchetypeUnits.INCH },
      height23: { height: 23 * AutoMovieArchetypeUnits.INCH },
      height24: { height: 24 * AutoMovieArchetypeUnits.INCH },
      height25: { height: 25 * AutoMovieArchetypeUnits.INCH },
      height26: { height: 26 * AutoMovieArchetypeUnits.INCH },
      height27: { height: 27 * AutoMovieArchetypeUnits.INCH },
      height28: { height: 28 * AutoMovieArchetypeUnits.INCH },
      height29: { height: 29 * AutoMovieArchetypeUnits.INCH },
      height30: { height: 30 * AutoMovieArchetypeUnits.INCH },
      height31: { height: 31 * AutoMovieArchetypeUnits.INCH },
    },
  };

  /**
   * How far in from the top's edges the legs' centres stand, metres: a
   * construction estimate no act reads.
   */
  export const LEG_INSET: number = 0.05;

  /** A leg's radius, metres: a construction estimate no act reads. */
  export const LEG_RADIUS: number = 0.025;

  /**
   * How far a counter's and a service counter's top reaches past its base at
   * the front, metres: a construction estimate no act reads.
   */
  export const COUNTER_OVERHANG: number = 0.05;

  /** A pupil desk's top thickness, metres: its sheet's 5/8 in. */
  export const PUPIL_TOP: number = (5 / 8) * AutoMovieArchetypeUnits.INCH;

  /**
   * An altar's two pedestals as shares of its top's length and depth:
   * construction estimates no act reads, since the catalog draws but does not
   * size them.
   */
  export const ALTAR_PEDESTAL: Readonly<{ width: number; depth: number }> = {
    width: 0.2,
    depth: 0.7,
  };

  /**
   * The affordance ids:
   *
   * - `top`: the top as a face a person writes, leans or places a hand on.
   * - `stack`: the same top as a face an object is set down on.
   * - `front`, `back`, `left`, `right`: the top's edges on `+Z`, `-Z`, `+X` and
   *   `-X`, each facing out.
   */
  export type Affordance =
    | "top"
    | "stack"
    | "front"
    | "back"
    | "left"
    | "right";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the top above the floor.
   * - `length`: the top along `+X`.
   * - `depth`: the top along `+Z`.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "length" | "depth" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    length: "m",
    depth: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which table. */
    kind: Kind;

    /**
     * A service counter's length or a pupil desk's height, one of the kind's
     * `SIZES`; drawn from the seed when absent.
     */
    size?: Size;

    /** The model's id, unique in a scene; `table` when absent. */
    id?: string;
  }

  /**
   * The band of each free dimension, by kind: every dimension's, except a
   * service counter's length and a pupil desk's height, which are picked from
   * `SIZES`.
   */
  export const BANDS: Readonly<
    Record<
      Exclude<Kind, "serviceCounter" | "pupilDesk">,
      Readonly<Record<Dimension, IAutoMovieArchetypeBand>>
    > & {
      serviceCounter: Readonly<
        Record<Exclude<Dimension, "length">, IAutoMovieArchetypeBand>
      >;
      pupilDesk: Readonly<
        Record<Exclude<Dimension, "height">, IAutoMovieArchetypeBand>
      >;
    }
  > = TABLE_BANDS;}
