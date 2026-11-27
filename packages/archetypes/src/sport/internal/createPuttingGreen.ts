import { AutoMovieArchetypePuttingGreen } from "../AutoMovieArchetypePuttingGreen";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetype, AutoMovieArchetypeBand, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/*
 * A square putting green with its cup at the centre, the putting surface at Y =
 * 0 and the turf below it.
 *
 * The turf is sixteen convex sectors running from the cup's wall out to the
 * square's edge, so the cup is an open hole a rolling ball can fall into, with
 * a bottom at the rule's depth. `green` is the putting surface and `cup` the
 * hole's centre on it.
 * Parameter params: The model's id.
 * Parameter seed: The seed that draws the green's side within its band; absent, the
 * middle.
 * Returns: The green.
 */
export function createPuttingGreen(
  params: AutoMovieArchetypePuttingGreen.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypePuttingGreen.Affordance, "side"> {
  const draw: AutoMovieArchetypeDrawSession<"side"> =
    new AutoMovieArchetypeDrawSession("puttingGreen", { side: "m" }, seed, {});
  const { side }: Record<"side", number> = draw.dimensions({
    side: AutoMovieArchetypeBand.metres(
      6,
      10,
      "Provisional practice putting green side, metres",
    ),
  });
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypePuttingGreen.Affordance,
    "side"
  > = new AutoMovieArchetypeBuilder({
    material: "fabric",
    id: params.id,
    name: "putting green",
    draw,
  });
  const radius: number = AutoMovieArchetypePuttingGreen.CUP_DIAMETER / 2;
  const depth: number = AutoMovieArchetypePuttingGreen.CUP_DEPTH;
  const base: number = 0.02;
  const thick: number = depth + base;
  const half: number = side / 2;
  const ring = (angle: number, reach: number, y: number): IAutoMovieVector3 =>
    Vector3.create(reach * Math.cos(angle), y, reach * Math.sin(angle));

  // Each sector joins the cup wall's chord to the square's edge, where the
  // ray at angle a leaves the square at half / max(|cos a|, |sin a|).
  for (let index: number = 0; index < SECTORS; ++index) {
    const points: IAutoMovieVector3[] = [];
    for (const angle of [
      (2 * Math.PI * index) / SECTORS,
      (2 * Math.PI * (index + 1)) / SECTORS,
    ]) {
      const edge: number =
        half / Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)));
      for (const y of [0, -thick])
        points.push(ring(angle, radius, y), ring(angle, edge, y));
    }
    builder.convex(`turf-${index + 1}`, points, undefined, {
      color: "#3f8a3a",
    });
  }
  builder.box(
    "cupBottom",
    Vector3.create(2 * radius, base, 2 * radius),
    Vector3.create(0, -depth - base / 2, 0),
    { color: "#e9e9e4" },
  );
  builder.affordance({
    id: "green",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
    extent: null,
    width: side,
    depth: side,
  });
  builder.affordance({
    id: "cup",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
    extent: null,
  });

  // A fixed green uses a nominal assembly mass; it never moves.
  return builder.build(1000);
}

/*
 * Turf sectors around the cup; each spans 22.5 degrees, so square corners fall
 * on sector edges.
 */
const SECTORS: number = 16;
