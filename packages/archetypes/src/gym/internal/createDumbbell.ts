import { AutoMovieArchetypeDumbbell } from "../AutoMovieArchetypeDumbbell";
import { Vector3 } from "@automovie/engine";

import { ArchetypeDraw, AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDensity, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/*
 * A dumbbell: a short handle with a steel head at each end, held in one hand.
 *
 * It lies along `X` with the handle's middle at the origin. Each head is a
 * solid steel cylinder as thick as its own radius times `SQUAT`, sized so the
 * two heads and the handle weigh the dumbbell's mass, so a heavier one is
 * larger. `grip` is the handle, taken from the `-Z` side.
 * Parameter params: The kind and any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, each takes the middle of its band.
 * Returns: The dumbbell.
 * For a fixed dimension outside its band.
 */
export function createDumbbell(
  params: AutoMovieArchetypeDumbbell.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeDumbbell.Affordance, AutoMovieArchetypeDumbbell.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeDumbbell.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeDumbbell.Dimension>(
      "dumbbell",
      AutoMovieArchetypeDumbbell.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeDumbbell.Kind = ArchetypeDraw.choice(
    "dumbbell",
    "kind",
    params.kind ?? "fixed",
    AutoMovieArchetypeDumbbell.KINDS,
  );
  const d: Partial<Record<AutoMovieArchetypeDumbbell.Dimension, number>> = draw.dimensions(
    AutoMovieArchetypeDumbbell.BANDS[kind],
    AutoMovieArchetypeDumbbell.BANDS,
  );
  const half: number = d.handle! / 2;
  const slim: number = d.diameter! / 2;

  // Each head's radius from its share of the mass: a cylinder of steel as
  // thick as SQUAT radii.
  const steel: number =
    Math.max(
      0,
      d.mass! -
        AutoMovieArchetypeDensity.STEEL * Math.PI * slim * slim * d.handle!,
    ) / 2;
  const radius: number = Math.max(
    slim,
    Math.cbrt(
      steel /
        (AutoMovieArchetypeDensity.STEEL * Math.PI * AutoMovieArchetypeDumbbell.SQUAT),
    ),
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeDumbbell.Affordance,
    AutoMovieArchetypeDumbbell.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "dumbbell",
    draw,
  });
  builder.rod(
    "handle",
    slim,
    Vector3.create(-half, 0, 0),
    Vector3.create(half, 0, 0),
    { color: "#b8bcc2" },
  );
  for (const side of [1, -1] as const)
    builder.rod(
      side === 1 ? "head-left" : "head-right",
      radius,
      Vector3.create(side * half, 0, 0),
      Vector3.create(side * (half + AutoMovieArchetypeDumbbell.SQUAT * radius), 0, 0),
      { color: "#2c2f33" },
    );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.diameter!,
    length: d.handle!,
  });
  return builder.build(d.mass!);
}
