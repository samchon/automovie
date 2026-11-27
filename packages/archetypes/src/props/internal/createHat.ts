import type { AutoMovieArchetypeHat } from "../AutoMovieArchetypeHat";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { WornPropDraw } from "./WornPropDraw";

/*
 * Hat with a brim pinch and a crown socket.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createHat(
  params: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHat.Affordance, AutoMovieArchetypeHat.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof WornPropDraw.prepare<AutoMovieArchetypeHat.Affordance>> =
    WornPropDraw.prepare<AutoMovieArchetypeHat.Affordance>("hat", params, seed);
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
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
