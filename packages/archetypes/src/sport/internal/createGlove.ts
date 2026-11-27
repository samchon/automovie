import { AutoMovieArchetypeGlove } from "../AutoMovieArchetypeGlove";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";

/*
 * A baseball glove: a fielder's glove or a catcher's mitt.
 *
 * It lies on its back on the floor, the pocket up, the fingers toward `+Z` and
 * the wrist opening toward `-Z`, its centre over the origin. `hand` is the
 * wrist opening the hand slides into, its `+Y` out of the opening; `pocket` the
 * catching face a ball comes to, facing up. A glove is worn on the hand
 * (`IHumanProp.worn`), so a catch reads the pocket where the hand carries it.
 * Parameter params: The kind and any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, each takes the middle of its band.
 * Returns: The glove.
 * For a fixed dimension outside its band.
 */
export function createGlove(
  params: AutoMovieArchetypeGlove.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeGlove.Affordance, AutoMovieArchetypeGlove.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeGlove.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeGlove.Dimension>(
      "glove",
      AutoMovieArchetypeGlove.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeGlove.Kind = ArchetypeDraw.choice(
    "glove",
    "kind",
    params.kind,
    AutoMovieArchetypeGlove.KINDS,
  );
  const d: Record<AutoMovieArchetypeGlove.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeGlove.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeGlove.Affordance,
    AutoMovieArchetypeGlove.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "leather",
    id: params.id,
    name: kind === "fielder" ? "fielder's glove" : "catcher's mitt",
    draw,
  });
  const thick: number = AutoMovieArchetypeGlove.THICKNESS[kind];
  builder.box(
    "glove",
    AutoMovieEngineVector3.create(d.width, thick, d.length),
    AutoMovieEngineVector3.create(0, thick / 2, 0),
    { color: "#8b4513" },
  );
  builder.affordance({
    id: "hand",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, thick / 2, -d.length / 2),
      AutoMovieEngineVector3.create(0, 0, -1),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "pocket",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, thick, 0)),
    extent: null,
    width: d.width / 2,
    depth: d.length / 3,
  });
  return builder.build(d.mass);
}
