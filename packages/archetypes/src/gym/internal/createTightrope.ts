import { AutoMovieArchetypeTightrope } from "../AutoMovieArchetypeTightrope";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/*
 * A tightrope or slackline: a wire stretched level between two anchor posts.
 *
 * It stands on the floor with the middle of its span at the origin, the wire
 * along `X`. `bar` is the wire's middle, on its axis, `+Y` up: a walker stands
 * on it anywhere along its length (`lineWalk`, which also takes the sag its
 * load gives it).
 * Parameter params: Any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, each takes the middle of its band.
 * Returns: The rope.
 * For a fixed dimension outside its band.
 */
export function createTightrope(
  params: AutoMovieArchetypeTightrope.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeTightrope.Affordance, AutoMovieArchetypeTightrope.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeTightrope.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeTightrope.Dimension>(
      "tightrope",
      AutoMovieArchetypeTightrope.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeTightrope.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeTightrope.BANDS,
  );
  const half: number = d.span / 2;
  const height: number = d.height;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeTightrope.Affordance,
    AutoMovieArchetypeTightrope.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "tightrope",
    draw,
  });
  builder.rod(
    "wire",
    d.diameter / 2,
    AutoMovieEngineVector3.create(-half, height, 0),
    AutoMovieEngineVector3.create(half, height, 0),
    { color: "#c8c3b8" },
  );
  for (const side of [1, -1] as const)
    builder.rod(
      side === 1 ? "post-left" : "post-right",
      AutoMovieArchetypeTightrope.POST,
      AutoMovieEngineVector3.create(side * (half + AutoMovieArchetypeTightrope.POST), 0, 0),
      AutoMovieEngineVector3.create(side * (half + AutoMovieArchetypeTightrope.POST), height + 0.1, 0),
      { color: "#6b5a46" },
    );
  builder.affordance({
    id: "bar",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, height, 0)),
    extent: null,
    length: d.span,
    aperture: d.diameter,
  });
  return builder.build(d.mass);
}
