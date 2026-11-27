import type { AutoMovieArchetypePotteryWheel } from "../AutoMovieArchetypePotteryWheel";
import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/*
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
 * Parameter params: The optional scene id.
 * Returns: The wheel and its contacts, metres.
 */
export function createPotteryWheel(
  params: AutoMovieArchetypePotteryWheel.IParams = {},
): AutoMovieArchetype<
  AutoMovieArchetypePotteryWheel.Affordance,
  AutoMovieArchetypePotteryWheel.Dimension
> {
  const v: typeof Vector3.create = Vector3.create;
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypePotteryWheel.Dimension> =
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
    AutoMovieArchetypePotteryWheel.Affordance,
    AutoMovieArchetypePotteryWheel.Dimension
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

/*
 * A potter's wheel with a centred clay form. No source is read: the head's
 * height and diameter, the clay's size, how far its wall rises and the mass are
 * provisional construction estimates of a seated studio wheel.
 */
const SIZE: Readonly<AutoMovieArchetypePotteryWheel.ISize> = {
  height: 0.45,
  head: 0.3,
  clay: 0.06,
  wall: 0.008,
  start: 0.08,
  rise: 0.1,
  mass: 40,
};
