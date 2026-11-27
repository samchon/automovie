import type { AutoMovieArchetypePen } from "../AutoMovieArchetypePen";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { StationeryDraw } from "./StationeryDraw";

/*
 * Pen with a precision pinch and an axial writing tip along +Z.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createPen(
  params: Pick<
    StationeryDraw.IParams,
    "id" | "length" | "thickness" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypePen.Affordance, AutoMovieArchetypePen.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof StationeryDraw.prepare<AutoMovieArchetypePen.Affordance>> =
    StationeryDraw.prepare<AutoMovieArchetypePen.Affordance>("pen", params, seed);
  const length: number = d.length!;
  const thick: number = d.thickness!;

  builder.rod(
    "barrel",
    thick / 2,
    AutoMovieEngineVector3.create(0, thick / 2, 0),
    AutoMovieEngineVector3.create(0, thick / 2, length),
    { color: "#2a4d8f" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, thick / 2, length - 0.03),
      AutoMovieEngineVector3.create(0, 1, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: thick,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, thick / 2, length),
      AutoMovieEngineVector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}
