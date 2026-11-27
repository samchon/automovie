import { AutoMovieArchetypeShowcase } from "../AutoMovieArchetypeShowcase";
import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../../core/index";

/*
 * A glass showcase counter: a case with a glass top and front, shown to the
 * customer at `+Z` and served from the clerk's side at `-Z`.
 *
 * The case stands on the floor centred on the origin, its length along `X`. It
 * is one of the maker's two showcases read, whole: the model given, or one
 * drawn from the seed. `top` is the glass top, leaned on or set on; `edge` is
 * its customer-side edge, where hands and forearms rest.
 * Parameter params: The model, if the author fixes it.
 * Parameter seed: The seed that draws the model when it is not given; absent, the
 * first.
 * Returns: The showcase.
 * For a model the maker's sheet does not
 * list.
 */
export function createShowcase(
  params: AutoMovieArchetypeShowcase.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeShowcase.Affordance, AutoMovieArchetypeShowcase.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeShowcase.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeShowcase.Dimension>(
      "showcase",
      AutoMovieArchetypeShowcase.UNITS,
      seed,
    );
  const model: {
    name: AutoMovieArchetypeShowcase.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeShowcase.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeShowcase.Model>(
    "model",
    params.model,
    AutoMovieArchetypeShowcase.MODELS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeShowcase.Affordance,
    AutoMovieArchetypeShowcase.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `glass showcase ${model.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const length: number = model.figures.length!;
  const { depth, height } = CASE;
  builder.box("case", v(length, height, depth), v(0, height / 2, 0), {
    color: "#d9e4e8",
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, height, 0)),
    extent: null,
    width: length,
    depth,
  });
  builder.affordance({
    id: "edge",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, height, depth / 2),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    length,
  });
  return builder.build(model.figures.mass!);
}

/*
 * A Full Vision showcase's depth and height, metres, the same for both models:
 * the sheet's "20" deep x 38" high".
 */
const CASE: Readonly<{ depth: number; height: number }> = {
  depth: 20 * AutoMovieArchetypeUnits.INCH,
  height: 38 * AutoMovieArchetypeUnits.INCH,
};
