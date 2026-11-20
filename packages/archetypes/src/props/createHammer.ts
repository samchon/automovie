import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { HandToolDraw } from "./HandToolDraw";

/**
 * Hammer with a power grip near the butt and a head face toward +Z.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Hammer with a power grip near the butt and a head face toward +Z.
 * @evidence contracts/development/implementation.md#principled-implementation The head and handle meet below the striking face. Their relative densities keep the balance toward the head.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rectangular head supplies the striking face. The claw remains outside this proxy.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createHammer(
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
    HandToolDraw.prepare<"grip" | "face">("hammer", params, seed);
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;

  const handle: number = length - 0.03;
  HandToolDraw.handle(builder, handle, radius, { atButt: true });

  builder.box(
    "head",
    Vector3.create(0.028, 0.03, 0.11),
    Vector3.create(0, length - 0.015, 0),
    { color: "#55595f", density: 11 },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, length - 0.015, 0.055),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}
