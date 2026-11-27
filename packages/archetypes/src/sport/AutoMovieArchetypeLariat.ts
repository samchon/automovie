import { type AutoMovieArchetype } from "../core/index";
import { createLariat as createLariatImplementation } from "./internal/createLariat";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand, AutoMovieArchetypeUnits } from "../core";
import { type IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieEngineVector3 } from "@automovie/engine";
import { AutoMovieArchetypeLariatData } from "./internal/AutoMovieArchetypeLariatData";

/** Public operations for Auto Movie Archetype Lariat. */
export namespace AutoMovieArchetypeLariat {
  /**
   * The affordance ids:
   *
   * - `spoke`: the swinging hand's hold on loop and spoke together.
   * - `coils`: the tail the rein hand holds.
   * - `hondo`: the eye the loop runs through.
   * - `loop`: the loop's centre, its `+Y` the loop's normal.
   */
  export type Affordance = "spoke" | "coils" | "hondo" | "loop";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: the whole rope.
   * - `diameter`: the rope's.
   * - `loop`: the open loop's diameter.
   * - `spoke`: from the hondo to the hand.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "loop" | "spoke" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `lariat` when absent. */
    id?: string;
  }

  /** The lariat's standing part between two held ends. */
  export interface IStanding {
    /** The rope's points from one end to the other, world metres. */
    points: IAutoMovieVector3[];

    /**
     * Whether the ends are as far apart as the rope is long: straight and
     * tensioned.
     */
    taut: boolean;

    /** How far its middle hangs below the straight line, metres; 0 when taut. */
    sag: number;
  }

  /**
   * A lariat, a roper's catch rope: a loop running through the hondo, the eye
   * tied at the rope's working end, the spoke from the hondo back to the swinging
   * hand, and the coiled tail the other hand holds with the reins.
   *
   * It lies open on the floor: the loop a circle of the drawn diameter centred
   * over the origin in the `XZ` plane, the hondo at its `+Z` point, the spoke
   * running from it along `+Z`, and the coils lying beyond. The rope is rigid
   * here: an act swings, throws and settles the loop by posing it. `spoke` is the
   * swinging hand's hold, at the spoke's far end where the hand takes loop and
   * spoke together; `coils` is the tail the rein hand holds; `hondo` is the eye;
   * `loop` the loop's centre, its `+Y` the loop's normal.
   *
   * @param params Any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The lariat.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(params?: AutoMovieArchetypeLariat.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeLariat.Affordance, AutoMovieArchetypeLariat.Dimension> {
    return createLariatImplementation(params, seed);
  }

  /** Rods a circle of rope is drawn with. */
  export const SEGMENTS: number = 16;

  /** The hondo's length along the rope, metres: an estimate. */
  export const HONDO: number = 0.06;

  /** The coil's radius, metres: an estimate, a hand's coils. */
  export const COIL: number = 0.18;

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    loop: "m",
    spoke: "m",
    mass: "kg",
  };

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(
      30 * AutoMovieArchetypeUnits.FOOT,
      35 * AutoMovieArchetypeUnits.FOOT,
      `ranch ropes are commonly sold 30 to 35 ft; ${AutoMovieArchetypeLariatData.UNREAD}`,
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      (5 / 16) * AutoMovieArchetypeUnits.INCH,
      (3 / 8) * AutoMovieArchetypeUnits.INCH,
      `ranch ropes 5/16 to 3/8 in; ${AutoMovieArchetypeLariatData.UNREAD}`,
      true,
    ),
    loop: AutoMovieArchetypeBand.metres(1.2, 2.2, AutoMovieArchetypeLariatData.UNREAD, true),
    spoke: AutoMovieArchetypeBand.metres(0.9, 1.5, AutoMovieArchetypeLariatData.UNREAD, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.6, 1.2, AutoMovieArchetypeLariatData.UNREAD, true),
  };

  /**
   * Lay the standing part of a caught lariat between its two held ends, the
   * horn (or the hand) and the catch on the animal: straight and tensioned once
   * the ends are as far apart as the rope is long, sagging in a parabola of the
   * same length when they are closer.
   *
   * @param from One end, world metres.
   * @param to The other end, world metres.
   * @param length The standing part's length, metres.
   * @param segments How many straight pieces it is laid in.
   * @returns The laid rope.
   */
  export function standing(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    length: number,
    segments: number = SEGMENTS,
  ): IStanding {
    const chord: number = AutoMovieEngineVector3.distance(from, to);
    const taut: boolean = chord >= length;
    const sag: number =
      taut || chord === 0 ? 0 : Math.sqrt((3 * chord * (length - chord)) / 8);
    const points: IAutoMovieVector3[] = [];
    for (let k: number = 0; k <= segments; ++k) {
      const u: number = k / segments;
      points.push(
        AutoMovieEngineVector3.add(AutoMovieEngineVector3.lerp(from, to, u), {
          x: 0,
          y: -4 * sag * u * (1 - u),
          z: 0,
        }),
      );
    }
    return { points, taut, sag };
  }}
