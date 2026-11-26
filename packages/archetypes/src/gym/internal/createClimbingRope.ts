import { AutoMovieArchetypeClimbingRope } from "../AutoMovieArchetypeClimbingRope";
import { Vector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/**
 * A climbing rope hanging from an overhead anchor, as in a gym or from a
 * hovering helicopter's boom.
 *
 * It hangs above the origin along `+Y`, its anchor `anchor` metres up and its
 * free end `length` below that, a rope longer than its anchor is high lying no
 * lower than the floor. `line` is the rope's middle on its axis, its `+X` along
 * the rope pointing up to the anchor, with the rope's length and radius: a
 * climber grips and locks the feet anywhere along it, and a swinger hangs from
 * it about the anchor.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The rope.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createClimbingRope(
  params: AutoMovieArchetypeClimbingRope.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeClimbingRope.Affordance,
  AutoMovieArchetypeClimbingRope.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeClimbingRope.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeClimbingRope.Dimension>(
      "climbingRope",
      AutoMovieArchetypeClimbingRope.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeClimbingRope.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeClimbingRope.BANDS,
  );
  const length: number = Math.min(d.length, d.anchor);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeClimbingRope.Affordance,
    AutoMovieArchetypeClimbingRope.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "fabric",
    id: params.id,
    name: "climbing rope",
    draw,
  });
  builder.rod(
    "rope",
    d.diameter / 2,
    Vector3.create(0, d.anchor - length, 0),
    Vector3.create(0, d.anchor, 0),
    { color: "#c9a96e" },
  );
  builder.affordance({
    id: "line",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, d.anchor - length / 2, 0),
      Vector3.create(0, 0, 1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    length,
    radius: d.diameter / 2,
  });
  return builder.build(d.mass);
}
