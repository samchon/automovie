import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { StationeryDraw } from "./StationeryDraw";

/**
 * Pen with a precision pinch and an axial writing tip along +Z.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Pen with a precision pinch and an axial writing tip along +Z.
 * @evidence contracts/development/implementation.md#principled-implementation The grip starts behind the tip. The writing tip lies at the end of the barrel.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rigid barrel supplies both contacts at the saved pinch-to-tip distance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds one part and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createPen(
  params: Pick<
    StationeryDraw.IParams,
    "id" | "length" | "thickness" | "mass"
  > = {},
  seed?: number | string,
): Archetype<"grip" | "face", StationeryDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof StationeryDraw.prepare<"grip" | "face">> =
    StationeryDraw.prepare<"grip" | "face">("pen", params, seed);
  const length: number = d.length!;
  const thick: number = d.thickness!;

  builder.rod(
    "barrel",
    thick / 2,
    Vector3.create(0, thick / 2, 0),
    Vector3.create(0, thick / 2, length),
    { color: "#2a4d8f" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, thick / 2, length - 0.03),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: thick,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, thick / 2, length),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}
