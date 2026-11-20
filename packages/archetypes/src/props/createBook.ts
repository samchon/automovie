import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { StationeryDraw } from "./StationeryDraw";

/**
 * Book with a spine grip, a hinged cover and a separately turning leaf.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Book with a spine grip, a hinged cover and a separately turning leaf.
 * @evidence contracts/development/implementation.md#principled-implementation The cover and leaf pivot on the spine but carry separate edge and face sites.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The one representative page fits inside the saved closed thickness.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds three parts and six contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createBook(
  params: Pick<
    StationeryDraw.IParams,
    "id" | "width" | "length" | "thickness" | "mass"
  > = {},
  seed?: number | string,
): Archetype<
  "grip" | "face" | "hinge" | "edge" | "page" | "page-edge",
  StationeryDraw.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof StationeryDraw.prepare<
      "grip" | "face" | "hinge" | "edge" | "page" | "page-edge"
    >
  > = StationeryDraw.prepare<
    "grip" | "face" | "hinge" | "edge" | "page" | "page-edge"
  >("book", params, seed);
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
    frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.upright(Vector3.create(0, thick, 0)),
    extent: null,
    width,
    depth: length,
    rides: "hinge",
  });
  builder.affordance({
    id: "edge",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
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
