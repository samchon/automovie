import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/** Moving carton sizes from a supplier's guide seen in search results. */
const CARTON: string =
  "U-Haul moving cartons, small 16-3/8 x 12-5/8 x 12-5/8 in to large 18 x 18 x 24 in, packing guide seen only in search results";

/**
 * A cardboard box carried in two hands.
 *
 * The box stands on the floor at the origin, its width along `+X`. A hand takes
 * each side at half height, so the two grips are the box's width apart; its top
 * is a face another box rests on.
 *
 * @param params The load and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The box.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band,
 *   or a load above 25 kg.
 */
export function createBox(
  params: createBox.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createBox.Affordance, createBox.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createBox.Dimension> =
    new AutoMovieArchetypeDrawSession<createBox.Dimension>(
      "box",
      createBox.UNITS,
      seed,
      params,
    );
  const load: number = params.load ?? 0;
  if (!(load >= 0 && load <= createBox.LOAD))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "box",
      axis: "load",
      value: load,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: createBox.LOAD,
        unit: "kg",
      },
      reason: `${load} kg is more than a person lifts close to the body`,
      fix: "give a load of at most 25 kg, or split it over several boxes",
    });
  const d: Record<createBox.Dimension, number> = draw.dimensions(
    createBox.BANDS,
  );
  const width: number = d.width;
  const height: number = d.height;
  const depth: number = d.depth;
  const builder: AutoMovieArchetypeBuilder<
    createBox.Affordance,
    createBox.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "paper",
    id: params.id,
    name: "cardboard box",
    draw,
  });
  builder.box(
    "box",
    Vector3.create(width, height, depth),
    Vector3.create(0, height / 2, 0),
    { color: "#b98d5b" },
  );
  for (const [id, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create((sign * width) / 2, height / 2, 0),
        Vector3.create(sign, 0, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "two-hand",
      length: depth,
    });
  builder.affordance({
    id: "top",
    kind: "stack-top",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: [
      Vector3.create(-width / 2, 0, -depth / 2),
      Vector3.create(width / 2, 0, -depth / 2),
      Vector3.create(width / 2, 0, depth / 2),
      Vector3.create(-width / 2, 0, depth / 2),
    ],
  });
  builder.affordance({
    id: "front",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, height / 2, depth / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    width,
    depth: height,
  });
  return builder.build(d.mass + load);
}

/** Companion types and bands of {@link createBox}. */
export namespace createBox {
  /**
   * The greatest load, kilograms: HSE INDG143 Figure 1, a man's lift close to
   * the body between knuckle and elbow height
   * (https://www.hse.gov.uk/pubns/indg143.pdf).
   */
  export const LOAD: number = 25;

  /**
   * The affordance ids:
   *
   * - `left`, `right`: the side faces at half height, on `+X` and `-X`, where the
   *   two hands hold the box.
   * - `top`: the upper face, on which another object rests.
   * - `front`: the `+Z` face, pushed or leaned on.
   */
  export type Affordance = "left" | "right" | "top" | "front";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: along `+X`, `+Y` and `+Z`.
   * - `mass`: the empty carton, kilograms.
   */
  export type Dimension = "width" | "height" | "depth" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    depth: "m",
    mass: "kg",
  };

  /**
   * The parameters: the load, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `box` when absent. */
    id?: string;

    /** The mass of what the box holds, kilograms, at most 25; empty when absent. */
    load?: number;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.of(
      "m",
      (16 + 3 / 8) * AutoMovieArchetypeUnits.INCH,
      18 * AutoMovieArchetypeUnits.INCH,
      CARTON,
      true,
    ),
    height: AutoMovieArchetypeBand.of(
      "m",
      (12 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
      24 * AutoMovieArchetypeUnits.INCH,
      CARTON,
      true,
    ),
    depth: AutoMovieArchetypeBand.of(
      "m",
      (12 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
      18 * AutoMovieArchetypeUnits.INCH,
      CARTON,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.4,
      0.9,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
