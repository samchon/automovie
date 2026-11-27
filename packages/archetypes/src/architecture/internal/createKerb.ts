import { AutoMovieArchetypeKerb } from "../AutoMovieArchetypeKerb";
import { Vector3 } from "@automovie/engine";

import { ArchetypeDraw, AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/*
 * A single raised step a foot goes up or over: a road kerb or a free-standing
 * step.
 *
 * It stands on the ground centred on `X` with its back face at the origin's `Z`
 * and its front face toward `+Z`, the side it is approached from, its top at
 * the drawn height. `top` is the top face, facing up, where a foot lands;
 * `edge` the top's front edge, along `+X` with `+Y` up and `+Z` out of the face
 * below, which a foot clears going up or a stepping-over act clears going
 * across.
 * Parameter params: The kind and any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, each takes the middle of its band.
 * Returns: The kerb or step.
 * For a fixed dimension outside its band.
 */
export function createKerb(
  params: AutoMovieArchetypeKerb.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeKerb.Affordance, AutoMovieArchetypeKerb.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeKerb.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeKerb.Dimension>(
      "kerb",
      AutoMovieArchetypeKerb.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeKerb.Kind = ArchetypeDraw.choice(
    "kerb",
    "kind",
    params.kind,
    AutoMovieArchetypeKerb.KINDS,
  );
  const d: Record<AutoMovieArchetypeKerb.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeKerb.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeKerb.Affordance,
    AutoMovieArchetypeKerb.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "concrete",
    id: params.id,
    name: kind,
    draw,
  });
  builder.box(
    kind,
    Vector3.create(d.length, d.height, d.depth),
    Vector3.create(0, d.height / 2, d.depth / 2),
    { color: kind === "kerb" ? "#9a9a96" : "#b8b2a7" },
  );
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, d.height, d.depth / 2),
    ),
    extent: null,
    width: d.length,
    depth: d.depth,
  });
  builder.affordance({
    id: "edge",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, d.height, d.depth),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    length: d.length,
  });
  return builder.build(d.mass);
}
