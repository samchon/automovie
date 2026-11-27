import type { AutoMovieArchetypeLadle } from "../AutoMovieArchetypeLadle";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { HandToolDraw } from "./HandToolDraw";

/*
 * Ladle with a pinch grip and a bowl facing +Z.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createLadle(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass" | "bowl"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLadle.Affordance, AutoMovieArchetypeLadle.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<AutoMovieArchetypeLadle.Affordance>> =
    HandToolDraw.prepare<AutoMovieArchetypeLadle.Affordance>("ladle", params, seed);
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;
  const v: typeof Vector3.create = Vector3.create;

  const handle: number = length - d.bowl!;
  HandToolDraw.handle(builder, handle, radius, {
    steel: true,
    precision: true,
  });

  // A ladle's bowl beyond its handle, its opening toward +Z.
  builder.ball("bowl", d.bowl! / 2, v(0, length - d.bowl! / 2, 0), {
    color: "#b9bcc0",
    surface: "steel",
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, length - d.bowl! / 2, d.bowl! / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass!, { rests: "steel" });
}
