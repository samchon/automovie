import { AutoMovieArchetypeSurfboard } from "../AutoMovieArchetypeSurfboard";
import { Vector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/*
 * A shortboard lying flat on the ground, its length along `Z` and its nose
 * toward `-Z`.
 *
 * It is one of the maker's three boards read, whole: the model given, or one
 * drawn from the seed. `deck` is its top, the surface the feet stand on and the
 * chest lies on. `frontStance` and `rearStance` mark provisional foot sites at
 * one fifth of the board's length to either side of the middle. `rail` is the
 * carry grip on the `+X` edge. Both lower rail lines can be sampled on a moving
 * prop.
 * Parameter params: The board and any dimension the author fixes.
 * Parameter seed: The seed that draws the board when it is not given and every
 * dimension left free inside its band; absent, the first board and the middle
 * of each band.
 * Returns: The board.
 * For a board the chart does not list, or a
 * fixed dimension outside its band.
 */
export function createSurfboard(
  params: AutoMovieArchetypeSurfboard.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSurfboard.Affordance, AutoMovieArchetypeSurfboard.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSurfboard.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeSurfboard.Dimension>(
      "surfboard",
      AutoMovieArchetypeSurfboard.UNITS,
      seed,
      params,
    );
  const model: {
    name: AutoMovieArchetypeSurfboard.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeSurfboard.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeSurfboard.Model>(
    "model",
    params.model,
    AutoMovieArchetypeSurfboard.MODELS,
  );
  const d: Partial<Record<AutoMovieArchetypeSurfboard.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeSurfboard.BANDS),
    ...model.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSurfboard.Affordance,
    AutoMovieArchetypeSurfboard.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `surfboard ${model.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const length: number = d.length!;
  const width: number = d.width!;
  const thickness: number = d.thickness!;
  builder.box("board", v(width, thickness, length), v(0, thickness / 2, 0), {
    color: "#f4f1e8",
    density: 0.15,
  });
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, thickness, 0)),
    extent: null,
    width,
    depth: length,
  });
  builder.affordance({
    id: "prone",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, thickness, length / 12)),
    extent: null,
    width,
    depth: length / 3,
  });
  // The two palm patches sit inside the material rails, ahead of the prone hips.
  for (const [id, sign] of [
    ["leftPalm", -1],
    ["rightPalm", 1],
  ] as const)
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        v((sign * width) / 3, thickness, -length / 6),
      ),
      extent: null,
      width: width / 3,
      depth: length / 6,
    });
  builder.affordance({
    id: "rail",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(width / 2, thickness / 2, 0),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: thickness,
  });
  for (const [id, sign] of [
    ["frontStance", -1],
    ["rearStance", 1],
  ] as const)
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        v(0, thickness, (sign * length) / 5),
      ),
      extent: null,
      width,
      depth: length / 5,
    });
  for (const [id, sign] of [
    ["leftRail", 1],
    ["rightRail", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "ledge",
      frame: AutoMovieArchetypeFrame.facing(
        v((sign * width) / 2, 0, 0),
        v(0, 1, 0),
        v(0, 0, -sign),
      ),
      extent: null,
      length,
    });
  return builder.build(d.mass!);
}
