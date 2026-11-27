import { AutoMovieArchetypeStilt } from "../AutoMovieArchetypeStilt";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/*
 * A walking stilt: a foot platform strapped under the foot on an upright pole
 * that ends in a rubber tip.
 *
 * It stands on its tip at the origin, the pole along `Y`. `foot` is the
 * platform's top at the pole's head, `+Y` up, `+Z` the toes' way: the sole
 * stands there. `tip` is the pole's foot on the floor.
 * Parameter params: Any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, each takes the middle of its band.
 * Returns: The stilt.
 * For a fixed dimension outside its band.
 */
export function createStilt(
  params: AutoMovieArchetypeStilt.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeStilt.Affordance, AutoMovieArchetypeStilt.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStilt.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeStilt.Dimension>(
      "stilt",
      AutoMovieArchetypeStilt.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeStilt.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeStilt.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStilt.Affordance,
    AutoMovieArchetypeStilt.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "stilt",
    draw,
  });
  builder.rod(
    "pole",
    AutoMovieArchetypeStilt.POLE,
    AutoMovieEngineVector3.create(0, 0, 0),
    AutoMovieEngineVector3.create(0, d.height - AutoMovieArchetypeStilt.PLATFORM, 0),
    { color: "#8a6a44" },
  );
  builder.box(
    "platform",
    AutoMovieEngineVector3.create(0.1, AutoMovieArchetypeStilt.PLATFORM, d.length),
    AutoMovieEngineVector3.create(0, d.height - AutoMovieArchetypeStilt.PLATFORM / 2, 0),
    { color: "#5b4a3a" },
  );
  builder.affordance({
    id: "foot",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, d.height, 0)),
    extent: null,
    width: 0.1,
    depth: d.length,
  });
  builder.affordance({
    id: "tip",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, 0, 0)),
    extent: null,
    width: 2 * AutoMovieArchetypeStilt.POLE,
    depth: 2 * AutoMovieArchetypeStilt.POLE,
  });
  return builder.build(d.mass);
}
