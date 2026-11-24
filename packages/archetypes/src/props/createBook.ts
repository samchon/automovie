import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { StationeryDraw } from "./StationeryDraw";

/**
 * Book with a spine grip, a hinged cover and a separately turning leaf.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createBook(
  params: Pick<
    StationeryDraw.IParams,
    "id" | "width" | "length" | "thickness" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<createBook.Affordance, createBook.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof StationeryDraw.prepare<createBook.Affordance>> =
    StationeryDraw.prepare<createBook.Affordance>("book", params, seed);
  const width: number = d.width!;
  const length: number = d.length!;
  const thick: number = d.thickness!;

  // Give one leaf a layer of the closed book's existing thickness.
  const pageThickness: number = StationeryDraw.BANDS.paper.thickness!.minimum;
  const pageHeight: number = (thick + pageThickness) / 2;
  builder.box(
    "back",
    Vector3.create(width, thick / 2, length),
    Vector3.create(0, thick / 4, 0),
    { color: "#7a3b2e" },
  );
  builder.box(
    "front",
    Vector3.create(width, thick / 2 - pageThickness, length),
    Vector3.create(0, (3 * thick) / 4 + pageThickness / 2, 0),
    { color: "#8d4636" },
  );
  builder.box(
    "leaf",
    Vector3.create(width, pageThickness, length),
    Vector3.create(0, pageHeight, 0),
    { color: "#f4f2ec" },
  );
  builder.affordance({
    id: "hinge",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(-width / 2, thick / 2, 0),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    travel: 180,
    parts: ["front"],
  });
  builder.affordance({
    id: "page",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(-width / 2, pageHeight, 0),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
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
      Vector3.create(width / 2, pageHeight, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
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
      Vector3.create(-width / 2, thick / 2, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
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
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, thick, 0)),
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
      Vector3.create(width / 2, (3 * thick) / 4 + pageThickness / 2, 0),
      Vector3.create(1, 0, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    length,
    rides: "hinge",
  });
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createBook}. */
export namespace createBook {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance =
    | "edge"
    | "face"
    | "grip"
    | "hinge"
    | "page"
    | "page-edge";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";
}
