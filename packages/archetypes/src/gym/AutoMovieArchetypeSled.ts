import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** What no source read gives. */
const UNREAD: string =
  "the Rogue pages read give no distance between the uprights; inside the base's width";

/** Constructs the sled archetype from its recipe. */
export namespace AutoMovieArchetypeSled {
/**
 * A push sled: a weighted base on the floor with two upright poles a pusher
 * leans into.
 *
 * The base runs forward along `+Z` from its back edge at the origin, centred on
 * `X`, and the pusher stands behind it at `-Z`, facing `+Z`. The two poles rise
 * from the base's back corners; `left` and `right` are the upper reach of each,
 * the pusher's left and right hand's handle (`left` at `+X`, the pusher's left
 * as it faces `+Z`), taken from behind (`-Z`) with the pole's axis along `+X`
 * of the frame; `deck` is the base's top, where plates are loaded.
 *
 * @param params The sled model and any dimension the author fixes.
 * @param seed The seed that draws the model when it is not given and every
 *   dimension left free inside its band; absent, the first model and the middle
 *   of each band.
 * @returns The sled.
 * @throws {AutoMovieArchetypeRefusal} For a model Rogue does not list or a
 *   fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeSled.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSled.Affordance, AutoMovieArchetypeSled.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSled.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeSled.Dimension>(
      "sled",
      AutoMovieArchetypeSled.UNITS,
      seed,
      params,
    );
  const model: {
    name: AutoMovieArchetypeSled.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeSled.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeSled.Model>("model", params.model, AutoMovieArchetypeSled.MODELS);
  const d: Partial<Record<AutoMovieArchetypeSled.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeSled.BANDS),
    ...model.figures,
  };
  const width: number = d.width!;
  const length: number = d.length!;
  const height: number = d.height!;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSled.Affordance,
    AutoMovieArchetypeSled.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: `push sled ${model.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const base: number = AutoMovieArchetypeSled.BASE;
  const pole: number = AutoMovieArchetypeSled.POLE;
  builder.box("base", v(width, base, length), v(0, base / 2, length / 2), {
    color: "#2c2f33",
    density: 3,
  });
  for (const [id, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const x: number = (sign * d.spacing!) / 2;
    builder.rod(`${id}Pole`, pole / 2, v(x, base, pole), v(x, height, pole), {
      color: "#8a8d91",
    });
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, height - AutoMovieArchetypeSled.HAND, pole),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: pole,
      length: AutoMovieArchetypeSled.HAND,
    });
  }
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, base, length / 2)),
    extent: null,
    width,
    depth: length,
  });
  return builder.build(d.mass!);
}
}

/** Companion types, constants and bands of {@link createSled}. */
export namespace AutoMovieArchetypeSled {
  /** The base's thickness, metres: an estimate. */
  export const BASE: number = 0.1;

  /** The poles' diameter, metres: an estimate. */
  export const POLE: number = 0.04;

  /** A hand's breadth on the pole below its top, metres: an estimate. */
  export const HAND: number = 0.12;

  /**
   * The affordance ids:
   *
   * - `left`, `right`: the poles' tops, the pusher's left and right handles,
   *   taken from `-Z`.
   * - `deck`: the base's top.
   */
  export type Affordance = "left" | "right" | "deck";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the poles' tops above the floor.
   * - `spacing`: between the poles' axes.
   * - `length`, `width`: the base's.
   * - `mass`: kilograms, unloaded.
   */
  export type Dimension = "height" | "spacing" | "length" | "width" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    spacing: "m",
    length: "m",
    width: "m",
    mass: "kg",
  };

  /** Rogue's sleds. */
  export type Model = "Slice" | "Echo Dog";

  /**
   * Each sled's figures, metres and kilograms, the default first: Rogue's Slice
   * Sled, "27.5 x 22.75 in", 37.25 in to the handles' tops, 65 lb
   * (https://support.roguefitness.com/hc/en-us/articles/47308098443156-Product-Guide-Rogue-Slice-Sled);
   * its Echo Dog Sled, 36.5 x 25 in, 37.5 in high with its uprights, 87 lb
   * (https://www.roguefitness.com/rogue-echo-dog-sled).
   */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    Slice: {
      length: 27.5 * AutoMovieArchetypeUnits.INCH,
      width: 22.75 * AutoMovieArchetypeUnits.INCH,
      height: 37.25 * AutoMovieArchetypeUnits.INCH,
      mass: 65 * AutoMovieArchetypeUnits.POUND,
    },
    "Echo Dog": {
      length: 36.5 * AutoMovieArchetypeUnits.INCH,
      width: 25 * AutoMovieArchetypeUnits.INCH,
      height: 37.5 * AutoMovieArchetypeUnits.INCH,
      mass: 87 * AutoMovieArchetypeUnits.POUND,
    },
  };

  /** The parameters: the sled, and the spacing fixed to a value inside its band. */
  export interface IParams extends Partial<Record<"spacing", number>> {
    /** Rogue's sled; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `sled` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<"spacing", IAutoMovieArchetypeBand>> = {
    // Inside the narrowest base less a pole, so both poles stand on it.
    spacing: AutoMovieArchetypeBand.metres(0.45, 0.53, UNREAD, true),
  };
}
