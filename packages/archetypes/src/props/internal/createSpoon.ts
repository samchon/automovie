import type { AutoMovieArchetypeSpoon } from "../AutoMovieArchetypeSpoon";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { HandToolDraw } from "./HandToolDraw";

/**
 * Spoon with a pinch grip and an bowl facing +Z in its tool frame.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createSpoon(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSpoon.Affordance, AutoMovieArchetypeSpoon.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<AutoMovieArchetypeSpoon.Affordance>> =
    HandToolDraw.prepare<AutoMovieArchetypeSpoon.Affordance>("spoon", params, seed);
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;

  const handle: number = length - 2 * HandToolDraw.BOWL;
  HandToolDraw.handle(builder, handle, radius, {
    steel: true,
    precision: true,
  });

  // The bowl is a disc on the handle's end whose far rim is the spoon's drawn length.
  const centre: number = length - HandToolDraw.BOWL;
  builder.rod(
    "bowl",
    HandToolDraw.BOWL,
    Vector3.create(0, centre, -0.001),
    Vector3.create(0, centre, 0.001),
    { color: "#b9bcc0", surface: "steel" },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, centre, 0.001),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass!, { rests: "steel" });
}
