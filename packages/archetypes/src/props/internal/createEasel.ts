import type { AutoMovieArchetypeEasel } from "../AutoMovieArchetypeEasel";
import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/*
 * An easel standing on the floor with a canvas upright on it.
 *
 * The easel stands at the origin, the canvas' painted face toward `-Z`, where
 * the painter stands. `canvas` is that face, its outward normal (`+Y` of the
 * frame) toward `-Z` and its `X` along world `+X`, `width` across and `depth`
 * up, centred at `centre` above the floor.
 * Parameter params: The optional scene id.
 * Returns: The easel and its canvas surface, metres.
 */
export function createEasel(
  params: AutoMovieArchetypeEasel.IParams = {},
): AutoMovieArchetype<AutoMovieArchetypeEasel.Affordance, AutoMovieArchetypeEasel.Dimension> {
  const v: typeof Vector3.create = Vector3.create;
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeEasel.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "easel",
      { width: "m", height: "m", centre: "m", mass: "kg" },
      undefined,
    );
  draw.derive("width", SIZE.width);
  draw.derive("height", SIZE.height);
  draw.derive("centre", SIZE.centre);
  draw.derive("mass", SIZE.mass);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeEasel.Affordance,
    AutoMovieArchetypeEasel.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "easel",
    name: "easel",
    material: "wood",
    draw,
  });
  const tall: number = SIZE.centre + SIZE.height / 2 + 0.2;
  for (const side of [-1, 1])
    builder.box(
      `leg${side}`,
      v(0.03, tall, 0.03),
      v((side * SIZE.width) / 2, tall / 2, 0.05),
      {
        color: "#7a5a3a",
      },
    );
  builder.box(
    "ledge",
    v(SIZE.width + 0.06, 0.03, 0.06),
    v(0, SIZE.centre - SIZE.height / 2 - 0.015, 0),
    { color: "#7a5a3a" },
  );
  builder.box(
    "canvas",
    v(SIZE.width, SIZE.height, 0.02),
    v(0, SIZE.centre, 0),
    {
      color: "#f3efe6",
    },
  );
  builder.affordance({
    id: "canvas",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, SIZE.centre, -0.01),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
    width: SIZE.width,
    depth: SIZE.height,
  });
  return builder.build(SIZE.mass);
}

/*
 * A studio easel holding a canvas. No source is read: the canvas' size, its
 * centre's height for a standing painter and the mass are provisional
 * construction estimates.
 */
const SIZE: Readonly<AutoMovieArchetypeEasel.ISize> = {
  width: 0.5,
  height: 0.6,
  centre: 1.35,
  mass: 6,
};
