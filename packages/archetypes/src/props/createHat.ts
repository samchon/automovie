import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { WornPropDraw } from "./WornPropDraw";

/**
 * Hat with a brim pinch and a crown socket.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createHat(
  params: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<createHat.Affordance, createHat.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof WornPropDraw.prepare<createHat.Affordance>> =
    WornPropDraw.prepare<createHat.Affordance>("hat", params, seed);
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
    frame: AutoMovieArchetypeFrame.facing(
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
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height - thin, 0),
      v(0, -1, 0),
      v(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/** The contacts and dimensions of {@link createHat}. */
export namespace createHat {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "hold" | "wear";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";
}
