import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core";

/**
 * A Full Vision showcase's depth and height, metres, the same for both models:
 * the sheet's "20" deep x 38" high".
 */
const CASE: Readonly<{ depth: number; height: number }> = {
  depth: 20 * AutoMovieArchetypeUnits.INCH,
  height: 38 * AutoMovieArchetypeUnits.INCH,
};

/**
 * A glass showcase counter: a case with a glass top and front, shown to the
 * customer at `+Z` and served from the clerk's side at `-Z`.
 *
 * The case stands on the floor centred on the origin, its length along `X`. It
 * is one of the maker's two showcases read, whole: the model given, or one
 * drawn from the seed. `top` is the glass top, leaned on or set on; `edge` is
 * its customer-side edge, where hands and forearms rest.
 *
 * @param params The model, if the author fixes it.
 * @param seed The seed that draws the model when it is not given; absent, the
 *   first.
 * @returns The showcase.
 * @throws {AutoMovieArchetypeRefusal} For a model the maker's sheet does not
 *   list.
 */
export function createShowcase(
  params: createShowcase.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createShowcase.Affordance, createShowcase.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createShowcase.Dimension> =
    new AutoMovieArchetypeDrawSession<createShowcase.Dimension>(
      "showcase",
      createShowcase.UNITS,
      seed,
    );
  const model: {
    name: createShowcase.Model | undefined;
    figures: Readonly<Partial<Record<createShowcase.Dimension, number>>>;
  } = draw.model<createShowcase.Model>(
    "model",
    params.model,
    createShowcase.MODELS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createShowcase.Affordance,
    createShowcase.Dimension
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

/** Companion types and constants of {@link createShowcase}. */
export namespace createShowcase {
  /** The models read: Econoco's Full Vision showcases, 48 and 70 in long. */
  export type Model = "PW/SC482" | "PW/SC702";

  /**
   * The dimensions, each its model's: `length`, the case along `X`, metres;
   * `mass`, kilograms.
   */
  export type Dimension = "length" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    mass: "kg",
  };

  /**
   * Each showcase's length and mass, the default first: Econoco Showcases and
   * Counters 2025, Full Vision Showcase, "Available in two lengths; 48" long
   * and 70" long", "48" unit weighs 170 lbs. 70" unit weighs 190 lbs."
   * (https://www.econoco.com/media/contentmanager/content/brochure/Showcases_and_Counters_-_2025_1.pdf).
   */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "PW/SC482": {
      length: 48 * AutoMovieArchetypeUnits.INCH,
      mass: 170 * AutoMovieArchetypeUnits.POUND,
    },
    "PW/SC702": {
      length: 70 * AutoMovieArchetypeUnits.INCH,
      mass: 190 * AutoMovieArchetypeUnits.POUND,
    },
  };

  /**
   * The affordance ids:
   *
   * - `top`: the glass top, facing up.
   * - `edge`: the top's customer-side edge along `X`.
   */
  export type Affordance = "top" | "edge";

  /**
   * The clerk-side sliding doors' width and height, metres: unread, since the
   * sheet names "solid sliding privacy doors" but sizes neither. A read size
   * replaces this `null`, and the doors then become `slider` contacts.
   */
  export const DOORS: Readonly<{ width: number; height: number }> | null = null;

  /** The parameters: the model, if fixed. */
  export interface IParams {
    /** Which showcase; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `showcase` when absent. */
    id?: string;
  }
}
