import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { LongImplementDraw } from "./LongImplementDraw";

/**
 * Fishing rod standing on its butt, with a lower grip and an axial tip.
 *
 * @param params The optional scene ID, shaft diameter in metres and Daiwa model of the rendered rod.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fishing rod standing on its butt, with a lower grip and an axial tip.
 * @evidence contracts/development/implementation.md#principled-implementation The selected whole model supplies the length and mass. The grip stays centered above the butt and the tip follows the end.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rod remains the original rigid visual proxy.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the rod and two contact frames.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createFishingRod(
  params: Pick<LongImplementDraw.IParams, "id" | "shaftDiameter"> & {
    model?: LongImplementDraw.Model;
  } = {},
  seed?: number | string,
): Archetype<"grip" | "tip", LongImplementDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<"grip" | "tip">> =
    LongImplementDraw.prepare<"grip" | "tip">("fishingRod", params, seed);
  const length: number = d.length!;
  const radius: number = d.shaftDiameter! / 2;

  // A rod on its butt: the grip a hand takes and the tip it casts with.
  const grip: number = LongImplementDraw.ROD_GRIP;
  builder.rod(
    "rod",
    radius,
    Vector3.create(0, 0, 0),
    Vector3.create(0, length, 0),
    {
      color: "#2c2f33",
    },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, grip / 2, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * radius,
    length: grip,
  });
  builder.affordance({
    id: "tip",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.upright(Vector3.create(0, length, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}
