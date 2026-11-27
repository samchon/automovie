import type { AutoMovieArchetypeBook } from "../AutoMovieArchetypeBook";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { StationeryDraw } from "./StationeryDraw";

/*
 * Book with a spine grip, a hinged cover and a separately turning leaf.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createBook(
  params: Pick<
    StationeryDraw.IParams,
    "id" | "width" | "length" | "thickness" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBook.Affordance, AutoMovieArchetypeBook.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof StationeryDraw.prepare<AutoMovieArchetypeBook.Affordance>> =
    StationeryDraw.prepare<AutoMovieArchetypeBook.Affordance>("book", params, seed);
  const width: number = d.width!;
  const length: number = d.length!;
  const thick: number = d.thickness!;

  // Give one leaf a layer of the closed book's existing thickness.
  const pageThickness: number = StationeryDraw.BANDS.paper.thickness!.minimum;
  const pageHeight: number = (thick + pageThickness) / 2;
  builder.box(
    "back",
    AutoMovieEngineVector3.create(width, thick / 2, length),
    AutoMovieEngineVector3.create(0, thick / 4, 0),
    { color: "#7a3b2e" },
  );
  builder.box(
    "front",
    AutoMovieEngineVector3.create(width, thick / 2 - pageThickness, length),
    AutoMovieEngineVector3.create(0, (3 * thick) / 4 + pageThickness / 2, 0),
    { color: "#8d4636" },
  );
  builder.box(
    "leaf",
    AutoMovieEngineVector3.create(width, pageThickness, length),
    AutoMovieEngineVector3.create(0, pageHeight, 0),
    { color: "#f4f2ec" },
  );
  builder.affordance({
    id: "hinge",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(-width / 2, thick / 2, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
    travel: 180,
    parts: ["front"],
  });
  builder.affordance({
    id: "page",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(-width / 2, pageHeight, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
    travel: 180,
    parts: ["leaf"],
  });
  builder.affordance({
    id: "page-edge",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(width / 2, pageHeight, 0),
      AutoMovieEngineVector3.create(0, 1, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: pageThickness,
    rides: "page",
  });

  // The closed book is held by its spine, the `-X` edge the hinge lies on, which stays where it is when the book opens.
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(-width / 2, thick / 2, 0),
      AutoMovieEngineVector3.create(0, 1, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: thick,
    length,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, thick, 0)),
    extent: null,
    width,
    depth: length,
    rides: "hinge",
  });
  builder.affordance({
    id: "edge",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(width / 2, (3 * thick) / 4 + pageThickness / 2, 0),
      AutoMovieEngineVector3.create(1, 0, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    length,
    rides: "hinge",
  });
  return builder.build(d.mass!);
}
