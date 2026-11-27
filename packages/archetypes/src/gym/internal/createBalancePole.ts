import { AutoMovieArchetypeBalancePole } from "../AutoMovieArchetypeBalancePole";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/*
 * A wire walker's balancing pole: a long, heavy rod held across the body.
 *
 * Its middle is at the origin, the pole along `X`. `leftGrip` and `rightGrip`
 * lie `grip` apart about the middle, `+Y` up: the hands take them from above,
 * the left at `+X`.
 * Parameter params: Any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, each takes the middle of its band.
 * Returns: The pole.
 * For a fixed dimension outside its band.
 */
export function createBalancePole(
  params: AutoMovieArchetypeBalancePole.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeBalancePole.Affordance,
  AutoMovieArchetypeBalancePole.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBalancePole.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeBalancePole.Dimension>(
      "balancePole",
      AutoMovieArchetypeBalancePole.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeBalancePole.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeBalancePole.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeBalancePole.Affordance,
    AutoMovieArchetypeBalancePole.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "balancing pole",
    draw,
  });
  builder.rod(
    "pole",
    d.diameter / 2,
    AutoMovieEngineVector3.create(-d.length / 2, 0, 0),
    AutoMovieEngineVector3.create(d.length / 2, 0, 0),
    { color: "#a07a4c" },
  );
  for (const side of ["left", "right"] as const)
    builder.affordance({
      id: side === "left" ? "leftGrip" : "rightGrip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.upright(
        AutoMovieEngineVector3.create(((side === "left" ? 1 : -1) * d.grip) / 2, 0, 0),
      ),
      extent: null,
      length: 0.12,
      aperture: d.diameter,
    });
  return builder.build(d.mass);
}
