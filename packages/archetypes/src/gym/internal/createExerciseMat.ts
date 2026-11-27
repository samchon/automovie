import { AutoMovieArchetypeExerciseMat } from "../AutoMovieArchetypeExerciseMat";
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
 * An exercise mat laid on the floor: a thin yoga mat or a thicker gym mat.
 *
 * It lies flat, centred over the origin, its length along `Z`. `surface` is its
 * top, where a body lies, kneels or stands for a floor exercise.
 * Parameter params: The kind, a yoga mat's length and any dimension the author
 * fixes.
 * Parameter seed: The seed that draws a yoga mat's length when it is not given and
 * every dimension left free inside its band; absent, the first length and the
 * middle of each band.
 * Returns: The mat.
 * For a length Manduka does not list with a
 * mass, or one named for a gym mat, a fixed dimension outside its band, or
 * one only the other kind has.
 */
export function createExerciseMat(
  params: AutoMovieArchetypeExerciseMat.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeExerciseMat.Affordance,
  AutoMovieArchetypeExerciseMat.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeExerciseMat.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeExerciseMat.Dimension>(
      "exerciseMat",
      AutoMovieArchetypeExerciseMat.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeExerciseMat.Kind = ArchetypeDraw.choice(
    "exerciseMat",
    "kind",
    params.kind,
    AutoMovieArchetypeExerciseMat.KINDS,
  );
  const size: {
    name: AutoMovieArchetypeExerciseMat.Size | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeExerciseMat.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeExerciseMat.Size>(
    "size",
    params.size,
    AutoMovieArchetypeExerciseMat.SIZES[kind],
  );
  const d: Partial<Record<AutoMovieArchetypeExerciseMat.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeExerciseMat.BANDS[kind], AutoMovieArchetypeExerciseMat.BANDS),
    ...size.figures,
  };
  const length: number = d.length!;
  const width: number = d.width!;
  const thickness: number = d.thickness!;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeExerciseMat.Affordance,
    AutoMovieArchetypeExerciseMat.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "foam",
    id: params.id,
    name: size.name === undefined ? `${kind} mat` : `${kind} mat ${size.name}`,
    draw,
  });
  builder.box(
    "mat",
    AutoMovieEngineVector3.create(width, thickness, length),
    AutoMovieEngineVector3.create(0, thickness / 2, 0),
    { color: kind === "yoga" ? "#6a5acd" : "#2c2f33" },
  );
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, thickness, 0)),
    extent: null,
    width,
    depth: length,
  });
  return builder.build(d.mass!);
}
