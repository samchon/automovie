import type { AutoMovieArchetypeHammer } from "../AutoMovieArchetypeHammer";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { HandToolDraw } from "../HandToolDraw";

/**
 * Hammer with a power grip near the butt and a head face toward +Z.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createHammer(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHammer.Affordance, AutoMovieArchetypeHammer.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<AutoMovieArchetypeHammer.Affordance>> =
    HandToolDraw.prepare<AutoMovieArchetypeHammer.Affordance>("hammer", params, seed);
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
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, length - 0.015, 0.055),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}
