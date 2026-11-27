import { AutoMovieArchetypePell } from "../AutoMovieArchetypePell";
import { Vector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/**
 * A pell: the upright post a swordsman strikes in solo drill.
 *
 * The post stands on the ground at the origin. `target` is its `+Z` side, the
 * face a drill's cuts and thrusts are aimed at, as wide as the post and as
 * high; a site on it names a height, so a cut to the head and a cut to the leg
 * are two sites of one contact. `top` is the post's upper end.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The pell.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createPell(
  params: AutoMovieArchetypePell.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypePell.Affordance, AutoMovieArchetypePell.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypePell.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypePell.Dimension>(
      "pell",
      AutoMovieArchetypePell.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypePell.Dimension, number> = draw.dimensions(
    AutoMovieArchetypePell.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypePell.Affordance,
    AutoMovieArchetypePell.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "pell",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.rod("post", d.diameter / 2, v(0, 0, 0), v(0, d.height, 0), {
    color: "#a9825a",
  });
  builder.affordance({
    id: "target",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height / 2, d.diameter / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.diameter,
    depth: d.height,
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}
