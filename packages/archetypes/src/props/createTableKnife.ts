import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { HandToolDraw } from "./HandToolDraw";

/**
 * Table knife with a pinch grip and a food-side edge toward +Z.
 *
 * @param params The optional scene ID, grip diameter in metres and manufacturer model.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Table knife with a pinch grip and a food-side edge toward +Z.
 * @evidence contracts/development/implementation.md#principled-implementation The model fixes the blade and mass. The blade edge is a ledge in the +Z direction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The thin blade box preserves the saved edge and body mass without assuming a handle material.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createTableKnife(
  params: Pick<HandToolDraw.IParams, "id" | "gripDiameter"> & {
    model?: HandToolDraw.Model;
  } = {},
  seed?: number | string,
): Archetype<"grip" | "face", HandToolDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<"grip" | "face">> =
    HandToolDraw.prepare<"grip" | "face">("knife", params, seed);
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;

  const handle: number = length - d.blade!;
  HandToolDraw.handle(builder, handle, radius, { precision: true });

  // The blade beyond the handle, its spine toward -Z and its edge toward +Z.
  const width: number = d.bladeWidth!;
  builder.box(
    "blade",
    Vector3.create(width * HandToolDraw.KNIFE_THICKNESS, d.blade!, width),
    Vector3.create(0, handle + d.blade! / 2, 0),
    { color: "#b9bcc0" },
  );
  builder.affordance({
    id: "face",
    kind: "ledge",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, handle + d.blade! / 2, width / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    length: d.blade!,
  });
  return builder.build(d.mass!);
}
