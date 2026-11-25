import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

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
export function createLariat(
  params: createLariat.IParams = {},
  seed?: number,
): AutoMovieArchetype<createLariat.Affordance, createLariat.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createLariat.Dimension> =
    new AutoMovieArchetypeDrawSession<createLariat.Dimension>(
      "lariat",
      createLariat.UNITS,
      seed,
      params,
    );
  const d: Record<createLariat.Dimension, number> = draw.dimensions(
    createLariat.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createLariat.Affordance,
    createLariat.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "fabric",
    id: params.id,
    name: "lariat",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const r: number = d.diameter / 2;
  const ring = (
    id: string,
    centre: IAutoMovieVector3,
    radius: number,
  ): void => {
    for (let k: number = 0; k < createLariat.SEGMENTS; ++k) {
      const a: number = (2 * Math.PI * k) / createLariat.SEGMENTS;
      const b: number = (2 * Math.PI * (k + 1)) / createLariat.SEGMENTS;
      builder.rod(
        `${id}${k}`,
        r,
        v(
          centre.x + radius * Math.sin(a),
          centre.y,
          centre.z + radius * Math.cos(a),
        ),
        v(
          centre.x + radius * Math.sin(b),
          centre.y,
          centre.z + radius * Math.cos(b),
        ),
        { color: "#c9b48a" },
      );
    }
  };
  const loop: number = d.loop / 2;
  ring("loop", v(0, r, 0), loop);
  builder.rod(
    "hondo",
    r * 1.5,
    v(0, r, loop),
    v(0, r, loop + createLariat.HONDO),
    {
      color: "#b09a70",
    },
  );
  const hand: number = loop + createLariat.HONDO + d.spoke;
  builder.rod("spoke", r, v(0, r, loop + createLariat.HONDO), v(0, r, hand), {
    color: "#c9b48a",
  });
  // The tail: what the loop and spoke leave of the length, in turns of the coil's radius beyond the hand.
  const used: number = Math.PI * d.loop + createLariat.HONDO + d.spoke;
  const turns: number = Math.max(
    1,
    Math.round((d.length - used) / (2 * Math.PI * createLariat.COIL)),
  );
  const coilCentre: IAutoMovieVector3 = v(0, r, hand + 0.3 + createLariat.COIL);
  for (let t: number = 0; t < turns; ++t)
    ring(
      `coil${t}-`,
      v(coilCentre.x, r + t * d.diameter, coilCentre.z),
      createLariat.COIL,
    );
  builder.affordance({
    id: "spoke",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, r, hand),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * d.diameter,
    length: 0.1,
  });
  builder.affordance({
    id: "coils",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, r, coilCentre.z - createLariat.COIL),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 4 * d.diameter,
    length: 0.1,
  });
  builder.affordance({
    id: "hondo",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, r, loop),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "loop",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.upright(v(0, r, 0)),
    extent: null,
    width: d.loop,
  });
  return builder.build(d.mass);
}

/** Companion types, constants and bands of {@link createLariat}. */
export namespace createLariat {
  /** Rods a circle of rope is drawn with. */
  export const SEGMENTS: number = 16;

  /** The hondo's length along the rope, metres: an estimate. */
  export const HONDO: number = 0.06;

  /** The coil's radius, metres: an estimate, a hand's coils. */
  export const COIL: number = 0.18;

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

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `lariat` when absent. */
    id?: string;
  }

  /** What no source read gives. */
  const UNREAD: string = "no source read gives it; provisional";

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(
      30 * AutoMovieArchetypeUnits.FOOT,
      35 * AutoMovieArchetypeUnits.FOOT,
      `ranch ropes are commonly sold 30 to 35 ft; ${UNREAD}`,
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      (5 / 16) * AutoMovieArchetypeUnits.INCH,
      (3 / 8) * AutoMovieArchetypeUnits.INCH,
      `ranch ropes 5/16 to 3/8 in; ${UNREAD}`,
      true,
    ),
    loop: AutoMovieArchetypeBand.metres(1.2, 2.2, UNREAD, true),
    spoke: AutoMovieArchetypeBand.metres(0.9, 1.5, UNREAD, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.6, 1.2, UNREAD, true),
  };

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
    const chord: number = Vector3.distance(from, to);
    const taut: boolean = chord >= length;
    const sag: number =
      taut || chord === 0 ? 0 : Math.sqrt((3 * chord * (length - chord)) / 8);
    const points: IAutoMovieVector3[] = [];
    for (let k: number = 0; k <= segments; ++k) {
      const u: number = k / segments;
      points.push(
        Vector3.add(Vector3.lerp(from, to, u), {
          x: 0,
          y: -4 * sag * u * (1 - u),
          z: 0,
        }),
      );
    }
    return { points, taut, sag };
  }
}
