import { type AutoMovieArchetype } from "../core/index";
import { createPoloMallet as createPoloMalletImplementation } from "./internal/createPoloMallet";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand, AutoMovieArchetypeUnits } from "../core";

/** Public operations for Auto Movie Archetype Polo Mallet. */
export namespace AutoMovieArchetypePoloMallet {
  /**
   * The affordance ids:
   *
   * - `grip`: the grip, taken from `-Z`, its length along the shaft.
   * - `sling`: the wrist loop at the grip's end.
   * - `head`: the head's centre, its `+Y` down the shaft's line out of the
   *   mallet.
   * - `face`: the head's forehand side toward `+Z`.
   */
  export type Affordance = "grip" | "sling" | "head" | "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the head's underside to the grip's end.
   * - `headLength`: the head from end to end.
   * - `headDiameter`: the head across.
   * - `gripDiameter`: the grip's.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "headLength"
    | "headDiameter"
    | "gripDiameter"
    | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `poloMallet` when absent. */
    id?: string;
  }

  /**
   * A polo mallet: a cane shaft with a rubber-wrapped grip and a wrist sling at
   * its top, and a cigar-shaped head set across its foot, struck with the head's
   * long side.
   *
   * It stands on its head at the origin, the shaft straight up along `+Y` to the
   * grip's end, the head lying along `X`. `grip` is the grip the hand closes on;
   * `sling` the loop at the grip's end the wrist passes through; `head` the
   * head's centre, its `+Y` running out of the mallet down the shaft's line, the
   * working point a swing carries through the ball (`tip`); `face` the head's
   * side toward `+Z`, its `+Y` out of it, the striking side of a forehand (a
   * backhand strikes with the other side).
   *
   * @param params Any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The mallet.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(params?: AutoMovieArchetypePoloMallet.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypePoloMallet.Affordance, AutoMovieArchetypePoloMallet.Dimension> {
    return createPoloMalletImplementation(params, seed);
  }

  /** The cane shaft's diameter, metres: an estimate. */
  export const CANE: number = 0.014;

  /** The grip's length, metres: an estimate. */
  export const GRIP_LENGTH: number = 0.2;

  /** The sling loop's height, metres: an estimate, wide enough for a wrist. */
  export const SLING: number = 0.12;

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    headLength: "m",
    headDiameter: "m",
    gripDiameter: "m",
    mass: "kg",
  };

  /*
   * What no source read gives.
   */
  const UNREAD: string = "no source read gives it; provisional";

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(
      48 * AutoMovieArchetypeUnits.INCH,
      54 * AutoMovieArchetypeUnits.INCH,
      `polo mallets are sold from 48 to 54 in by the pony's height; ${UNREAD}`,
      true,
    ),
    headLength: AutoMovieArchetypeBand.metres(0.21, 0.24, UNREAD, true),
    headDiameter: AutoMovieArchetypeBand.metres(0.045, 0.055, UNREAD, true),
    gripDiameter: AutoMovieArchetypeBand.metres(0.025, 0.03, UNREAD, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.45, 0.6, UNREAD, true),
  };}
