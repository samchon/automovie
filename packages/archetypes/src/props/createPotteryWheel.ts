import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/**
 * A potter's wheel with a centred clay form. No source is read: the head's
 * height and diameter, the clay's size, how far its wall rises and the mass are
 * provisional construction estimates of a seated studio wheel.
 */
const SIZE: Readonly<createPotteryWheel.ISize> = {
  height: 0.45,
  head: 0.3,
  clay: 0.06,
  wall: 0.008,
  start: 0.08,
  rise: 0.1,
  mass: 40,
};

/**
 * A potter's wheel: a wheel head turning on a stand, with a form of clay thrown
 * on it whose wall rises as the hands draw it up.
 *
 * The wheel stands on the floor at the origin, its head's axis along `+Y`.
 * `head` is the head's articulation, a crank that turns without limit, so an
 * act spins it. The clay is centred on the head: a lump and a wall of `clay`
 * radius whose top stands `start` above the head and rises by up to `rise` on
 * the `raise` slider as it is drawn up. Clay is round about the head's axis, so
 * every point of its wall at one height is the same contact in the turning
 * head's frame: `outside` is the wall's outer face at its top, facing `+Z`,
 * `inside` its inner face, facing `-Z`, both riding the rise.
 *
 * @param params The optional scene id.
 * @returns The wheel and its contacts, metres.
 */
export function createPotteryWheel(
  params: createPotteryWheel.IParams = {},
): AutoMovieArchetype<
  createPotteryWheel.Affordance,
  createPotteryWheel.Dimension
> {
  const v: typeof Vector3.create = Vector3.create;
  const draw: AutoMovieArchetypeDrawSession<createPotteryWheel.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "potteryWheel",
      { height: "m", clay: "m", rise: "m", mass: "kg" },
      undefined,
    );
  draw.derive("height", SIZE.height);
  draw.derive("clay", SIZE.clay);
  draw.derive("rise", SIZE.rise);
  draw.derive("mass", SIZE.mass);
  const builder: AutoMovieArchetypeBuilder<
    createPotteryWheel.Affordance,
    createPotteryWheel.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "potteryWheel",
    name: "potter's wheel",
    material: "steel",
    draw,
  });
  const top: number = SIZE.height;
  // A column under the head, so a seated potter's legs straddle it.
  builder.rod("stand", 0.06, v(0, 0, 0), v(0, top - 0.03, 0), {
    color: "#5b6168",
  });
  builder.rod("head", SIZE.head / 2, v(0, top - 0.03, 0), v(0, top, 0), {
    color: "#8a8f94",
  });
  builder.rod("lump", SIZE.clay, v(0, top, 0), v(0, top + 0.03, 0), {
    color: "#9c6b4a",
  });
  builder.rod(
    "wall",
    SIZE.clay,
    v(0, top + 0.03, 0),
    v(0, top + SIZE.start, 0),
    {
      color: "#9c6b4a",
    },
  );
  builder.affordance({
    id: "head",
    kind: "crank",
    extent: null,
    parts: ["head"],
    frame: AutoMovieArchetypeFrame.upright(v(0, top, 0)),
  });
  builder.affordance({
    id: "raise",
    kind: "slider",
    extent: null,
    travel: SIZE.rise,
    parts: ["wall"],
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top + SIZE.start, 0),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
  });
  builder.affordance({
    id: "outside",
    kind: "socket",
    rides: "raise",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top + SIZE.start, SIZE.clay),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "inside",
    kind: "socket",
    rides: "raise",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top + SIZE.start, SIZE.clay - SIZE.wall),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(SIZE.mass);
}

/** The inputs, contacts and size of {@link createPotteryWheel}. */
export namespace createPotteryWheel {
  /** The head's crank, the wall's rise and its two faces. */
  export type Affordance = "head" | "raise" | "outside" | "inside";

  /** The head's height, the clay's radius, the rise and the mass. */
  export type Dimension = "height" | "clay" | "rise" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `potteryWheel` when absent. */
    id?: string;
  }

  /** The wheel's size, metres and kilograms. */
  export interface ISize {
    /** The head's top above the floor. */
    height: number;

    /** The head's diameter. */
    head: number;

    /** The clay's outer radius. */
    clay: number;

    /** The wall's thickness. */
    wall: number;

    /** The wall's top above the head at rest. */
    start: number;

    /** How far the wall rises. */
    rise: number;

    /** The mass. */
    mass: number;
  }
}
