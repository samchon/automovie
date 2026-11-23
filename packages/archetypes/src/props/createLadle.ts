import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { HandToolDraw } from "./HandToolDraw";

/**
 * Ladle with a pinch grip and a bowl facing +Z.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createLadle(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass" | "bowl"
  > = {},
  seed?: number | string,
): AutoMovieArchetype<createLadle.Affordance, createLadle.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<createLadle.Affordance>> =
    HandToolDraw.prepare<createLadle.Affordance>("ladle", params, seed);
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

/** The contacts and dimensions of {@link createLadle}. */
export namespace createLadle {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "grip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "bowl" | "gripDiameter" | "length" | "mass";
}
