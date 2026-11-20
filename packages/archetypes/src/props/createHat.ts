import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { WornPropDraw } from "./WornPropDraw";

/**
 * Hat with a brim pinch and a crown socket.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Hat with a brim pinch and a crown socket.
 * @evidence contracts/development/implementation.md#principled-implementation The brim carries the right-side pinch and the crown top owns the socket facing the head.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The coarse brim and crown are rigid with their saved thickness.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createHat(
  params: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > = {},
  seed?: number | string,
): Archetype<"hold" | "wear", WornPropDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof WornPropDraw.prepare<"hold" | "wear">> =
    WornPropDraw.prepare<"hold" | "wear">("hat", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const thin: number = WornPropDraw.THIN;

  // The brim on the table, the crown up from it.
  builder.rod("brim", d.width / 2, v(0, 0, 0), v(0, thin, 0), {
    color: "#3a3d42",
  });
  builder.rod("crown", d.depth / 2, v(0, thin, 0), v(0, d.height, 0), {
    color: "#3a3d42",
  });
  builder.affordance({
    id: "hold",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      v(-(d.width / 2 - 0.02), thin / 2, 0),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: thin,
  });
  // The head goes in from the brim's opening as far as the crown's
  // inside top, which rests on the head's crown.
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: ArchetypeFrame.facing(
      v(0, d.height - thin, 0),
      v(0, -1, 0),
      v(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}
