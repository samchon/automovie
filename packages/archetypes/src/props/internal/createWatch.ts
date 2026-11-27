import type { AutoMovieArchetypeWatch } from "../AutoMovieArchetypeWatch";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { WornPropDraw } from "./WornPropDraw";

/*
 * Wristwatch resting dial up with a straight band.
 *
 * The band runs along model Z. The dial's 12 o'clock lies toward model `-Z`, so
 * `face` reads with model `-Z` as its top.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createWatch(
  params: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeWatch.Affordance, AutoMovieArchetypeWatch.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof WornPropDraw.prepare<AutoMovieArchetypeWatch.Affordance>> =
    WornPropDraw.prepare<AutoMovieArchetypeWatch.Affordance>("watch", params, seed);
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const thin: number = WornPropDraw.THIN;

  // The strap flat along Z, the case on its middle.
  builder.box(
    "strap",
    v(WornPropDraw.STRAP, thin, d.depth),
    v(0, thin / 2, 0),
    { color: "#2c2f33" },
  );
  builder.box(
    "case",
    v(d.width, d.height, d.width),
    v(0, thin + d.height / 2, 0),
    { color: "#b9bcc0" },
  );
  builder.affordance({
    id: "hold",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, thin + d.height / 2, 0),
      v(1, 0, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: d.width,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.upright(v(0, thin + d.height, 0)),
    extent: null,
    width: d.width,
    depth: d.width,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(0, 0, 1)),
    extent: null,
  });
  return builder.build(d.mass);
}
