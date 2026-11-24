import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/**
 * A handheld electric torch (a flashlight): a barrel with a wider head and a
 * switch on the barrel, one of Maglite's two- and three-cell D torches whole.
 *
 * It stands on its tail at the origin, its head up along `+Y`. `grip` is the
 * barrel a hand closes on, taken from `-Z`; `lens` the head's front, its `+Y`
 * along the beam, the working point an aim carries; `switch` the push button on
 * the barrel's `+Z` side under the thumb, pressed along its `-Y`.
 *
 * @param params The model, and any dimension the author fixes.
 * @param seed The seed that picks the model when none is given; absent, the
 *   first model.
 * @returns The torch.
 * @throws {AutoMovieArchetypeRefusal} For a model the torch does not have, or a
 *   fixed dimension that is the model's own figure.
 */
export function createTorch(
  params: createTorch.IParams = {},
  seed?: number,
): AutoMovieArchetype<createTorch.Affordance, createTorch.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createTorch.Dimension> =
    new AutoMovieArchetypeDrawSession<createTorch.Dimension>(
      "torch",
      createTorch.UNITS,
      seed,
      params,
    );
  // A torch is one of the maker's models whole.
  const model: {
    name: createTorch.Model | undefined;
    figures: createTorch.Figures;
  } = draw.model<createTorch.Model>("model", params.model, createTorch.MODELS);
  const d: Record<createTorch.Dimension, number> = {
    length: model.figures.length!,
    diameter: model.figures.diameter!,
    mass: model.figures.mass!,
  };
  const builder: AutoMovieArchetypeBuilder<
    createTorch.Affordance,
    createTorch.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "aluminium",
    id: params.id,
    name: "torch",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const head: number = createTorch.HEAD;
  const barrel: number = d.length - head;
  const r: number = d.diameter / 2;
  builder.rod("barrel", r, v(0, 0, 0), v(0, barrel, 0), { color: "#2c2f33" });
  builder.rod(
    "head",
    createTorch.HEAD_DIAMETER / 2,
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
    travel: createTorch.PRESS,
  });
  return builder.build(d.mass);
}

/** Companion types, constants and bands of {@link createTorch}. */
export namespace createTorch {
  /** The head's diameter, metres: the Maglite 2-Cell and 3-Cell D's 57 mm. */
  export const HEAD_DIAMETER: number = 0.057;

  /**
   * The head's length, metres: an estimate; the maker's page read does not give
   * it.
   */
  export const HEAD: number = 0.04;

  /** The switch's press, metres: an estimate. */
  export const PRESS: number = 0.002;

  /**
   * The affordance ids:
   *
   * - `grip`: the barrel, taken from `-Z`.
   * - `lens`: the head's front, `+Y` along the beam.
   * - `switch`: the push button on the barrel's `+Z` side.
   */
  export type Affordance = "grip" | "lens" | "switch";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: tail to lens.
   * - `diameter`: the barrel's.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The parameters: the model. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The maker's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `torch` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The maker's torches read: the Maglite 2-Cell D LED and 3-Cell D LED. */
  export type Model = "twoCellD" | "threeCellD";

  /**
   * Each model whole, the default first, with batteries: the 2-Cell D LED 254
   * mm long, a 39.67 mm barrel, 674 g
   * (https://maglite.com/pages/specifications-maglite-2-cell-d-led-flashlight);
   * the 3-Cell D LED 313 mm, 39.67 mm, 856 g
   * (https://maglite.com/pages/specifications-maglite-3-cell-d-led-flashlight).
   */
  export const MODELS: Readonly<Record<Model, Figures>> = {
    twoCellD: { length: 0.254, diameter: 0.03967, mass: 0.674 },
    threeCellD: { length: 0.313, diameter: 0.03967, mass: 0.856 },
  };
}
