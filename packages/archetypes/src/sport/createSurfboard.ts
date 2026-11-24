import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/**
 * A shortboard lying flat on the ground, its length along `Z` and its nose
 * toward `-Z`.
 *
 * It is one of the maker's three boards read, whole: the model given, or one
 * drawn from the seed. `deck` is its top, the surface the feet stand on and the
 * chest lies on. `frontStance` and `rearStance` mark provisional foot sites at
 * one fifth of the board's length to either side of the middle. `rail` is the
 * carry grip on the `+X` edge. Both lower rail lines can be sampled on a moving
 * prop.
 *
 * @param params The board and any dimension the author fixes.
 * @param seed The seed that draws the board when it is not given and every
 *   dimension left free inside its band; absent, the first board and the middle
 *   of each band.
 * @returns The board.
 * @throws {AutoMovieArchetypeRefusal} For a board the chart does not list, or a
 *   fixed dimension outside its band.
 */
export function createSurfboard(
  params: createSurfboard.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createSurfboard.Affordance, createSurfboard.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createSurfboard.Dimension> =
    new AutoMovieArchetypeDrawSession<createSurfboard.Dimension>(
      "surfboard",
      createSurfboard.UNITS,
      seed,
      params,
    );
  const model: {
    name: createSurfboard.Model | undefined;
    figures: Readonly<Partial<Record<createSurfboard.Dimension, number>>>;
  } = draw.model<createSurfboard.Model>(
    "model",
    params.model,
    createSurfboard.MODELS,
  );
  const d: Partial<Record<createSurfboard.Dimension, number>> = {
    ...draw.dimensions(createSurfboard.BANDS),
    ...model.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    createSurfboard.Affordance,
    createSurfboard.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `surfboard ${model.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const length: number = d.length!;
  const width: number = d.width!;
  const thickness: number = d.thickness!;
  builder.box("board", v(width, thickness, length), v(0, thickness / 2, 0), {
    color: "#f4f1e8",
    density: 0.15,
  });
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, thickness, 0)),
    extent: null,
    width,
    depth: length,
  });
  builder.affordance({
    id: "prone",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, thickness, length / 12)),
    extent: null,
    width,
    depth: length / 3,
  });
  // The two palm patches sit inside the material rails, ahead of the prone hips.
  for (const [id, sign] of [
    ["leftPalm", -1],
    ["rightPalm", 1],
  ] as const)
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        v((sign * width) / 3, thickness, -length / 6),
      ),
      extent: null,
      width: width / 3,
      depth: length / 6,
    });
  builder.affordance({
    id: "rail",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(width / 2, thickness / 2, 0),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: thickness,
  });
  for (const [id, sign] of [
    ["frontStance", -1],
    ["rearStance", 1],
  ] as const)
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        v(0, thickness, (sign * length) / 5),
      ),
      extent: null,
      width,
      depth: length / 5,
    });
  for (const [id, sign] of [
    ["leftRail", 1],
    ["rightRail", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "ledge",
      frame: AutoMovieArchetypeFrame.facing(
        v((sign * width) / 2, 0, 0),
        v(0, 1, 0),
        v(0, 0, -sign),
      ),
      extent: null,
      length,
    });
  return builder.build(d.mass!);
}

/** Companion types and bands of {@link createSurfboard}. */
export namespace createSurfboard {
  /** The boards read: the Lost Driver 2.0's 5'10, 6'0 and 6'2. */
  export type Model = "5'10" | "6'0" | "6'2";

  /**
   * The dimensions, metres unless stated:
   *
   * - `length`, `width`, `thickness`: the board's, its model's.
   * - `mass`: kilograms, free.
   */
  export type Dimension = "length" | "width" | "thickness" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    thickness: "m",
    mass: "kg",
  };

  /**
   * Each board's figures, metres, the default first: Lost Driver 2.0 size
   * chart, 5'10 x 18.75 x 2.36 in, 6'0 x 19.18 x 2.40 in, 6'2 x 19.50 x 2.50 in
   * (https://lostsurfboards.com/surfboards/driver/).
   */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "5'10": {
      length: 70 * AutoMovieArchetypeUnits.INCH,
      width: 18.75 * AutoMovieArchetypeUnits.INCH,
      thickness: 2.36 * AutoMovieArchetypeUnits.INCH,
    },
    "6'0": {
      length: 72 * AutoMovieArchetypeUnits.INCH,
      width: 19.18 * AutoMovieArchetypeUnits.INCH,
      thickness: 2.4 * AutoMovieArchetypeUnits.INCH,
    },
    "6'2": {
      length: 74 * AutoMovieArchetypeUnits.INCH,
      width: 19.5 * AutoMovieArchetypeUnits.INCH,
      thickness: 2.5 * AutoMovieArchetypeUnits.INCH,
    },
  };

  /**
   * The affordance ids:
   *
   * - `deck`: the top, the surface the feet and the chest meet.
   * - `rail`: the `+X` edge at the board's middle and half its thickness, a
   *   handle whose `+X` runs along the edge and whose aperture is the
   *   thickness.
   * - `prone`: the central deck patch used when mounting from water.
   * - `leftPalm`, `rightPalm`: the opposing material patches for a surfer facing
   *   the nose.
   * - `frontStance`, `rearStance`: provisional deck sites for the feet.
   * - `leftRail`, `rightRail`: the lower long edges for pose readings.
   */
  export type Affordance =
    | "deck"
    | "prone"
    | "leftPalm"
    | "rightPalm"
    | "rail"
    | "frontStance"
    | "rearStance"
    | "leftRail"
    | "rightRail";

  /** The parameters: the board, and the mass fixed to a value inside its band. */
  export interface IParams extends Partial<Record<"mass", number>> {
    /** Which board; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `surfboard` when absent. */
    id?: string;
  }

  /** The band of the free dimension. */
  export const BANDS: Readonly<Record<"mass", IAutoMovieArchetypeBand>> = {
    mass: AutoMovieArchetypeBand.of(
      "kg",
      2.5,
      3.5,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
