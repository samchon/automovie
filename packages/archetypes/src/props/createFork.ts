import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { HandToolDraw } from "./HandToolDraw";

/**
 * Fork with a pinch grip and a working tip along +Y.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fork with a pinch grip and a working tip along +Y.
 * @evidence contracts/development/implementation.md#principled-implementation The tines extend the handle to the named working tip.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tines share one thin solid. The steel finish is shared with the handle.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createFork(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass"
  > = {},
  seed?: number | string,
): Archetype<"grip" | "face", HandToolDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<"grip" | "face">> =
    HandToolDraw.prepare<"grip" | "face">("fork", params, seed);
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;

  const handle: number = length - HandToolDraw.TINES.length;
  HandToolDraw.handle(builder, handle, radius, {
    steel: true,
    precision: true,
  });

  // The tines are one flat plate on the handle's end, ending the fork's drawn length.
  const tines: Readonly<{ width: number; length: number }> = HandToolDraw.TINES;
  builder.box(
    "tines",
    Vector3.create(tines.width, tines.length, 0.002),
    Vector3.create(0, handle + tines.length / 2, 0),
    { color: "#b9bcc0", surface: "steel" },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, length, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass!, { rests: "steel" });
}
