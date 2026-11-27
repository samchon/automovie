import { AutoMovieArchetypeTorch } from "../AutoMovieArchetypeTorch";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/*
 * A handheld electric torch (a flashlight): a barrel with a wider head and a
 * switch on the barrel, one of Maglite's two- and three-cell D torches whole.
 *
 * It stands on its tail at the origin, its head up along `+Y`. `grip` is the
 * barrel a hand closes on, taken from `-Z`; `lens` the head's front, its `+Y`
 * along the beam, the working point an aim carries; `switch` the push button on
 * the barrel's `+Z` side under the thumb, pressed along its `-Y`.
 * Parameter params: The model, and any dimension the author fixes.
 * Parameter seed: The seed that picks the model when none is given; absent, the
 * first model.
 * Returns: The torch.
 * For a model the torch does not have, or a
 * fixed dimension that is the model's own figure.
 */
export function createTorch(
  params: AutoMovieArchetypeTorch.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeTorch.Affordance, AutoMovieArchetypeTorch.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeTorch.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeTorch.Dimension>(
      "torch",
      AutoMovieArchetypeTorch.UNITS,
      seed,
      params,
    );
  // A torch is one of the maker's models whole.
  const model: {
    name: AutoMovieArchetypeTorch.Model | undefined;
    figures: AutoMovieArchetypeTorch.Figures;
  } = draw.model<AutoMovieArchetypeTorch.Model>("model", params.model, AutoMovieArchetypeTorch.MODELS);
  const d: Record<AutoMovieArchetypeTorch.Dimension, number> = {
    length: model.figures.length!,
    diameter: model.figures.diameter!,
    mass: model.figures.mass!,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeTorch.Affordance,
    AutoMovieArchetypeTorch.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "aluminium",
    id: params.id,
    name: "torch",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const head: number = AutoMovieArchetypeTorch.HEAD;
  const barrel: number = d.length - head;
  const r: number = d.diameter / 2;
  builder.rod("barrel", r, v(0, 0, 0), v(0, barrel, 0), { color: "#2c2f33" });
  builder.rod(
    "head",
    AutoMovieArchetypeTorch.HEAD_DIAMETER / 2,
    v(0, barrel, 0),
    v(0, d.length, 0),
    {
      color: "#3a3d42",
    },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, barrel / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.diameter,
    length: barrel,
  });
  builder.affordance({
    id: "lens",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.length, 0),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "switch",
    kind: "button",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, barrel - 0.02, r),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    travel: AutoMovieArchetypeTorch.PRESS,
  });
  return builder.build(d.mass);
}
