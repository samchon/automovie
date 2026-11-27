import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The accessibility standard's ramp clauses. */
const ADA: string =
  "2010 ADA Standards (https://www.access-board.gov/ada/chapter/ch04/)";

/** Constructs the ramp archetype from its recipe. */
export namespace AutoMovieArchetypeRamp {
/**
 * A ramp with its top landing.
 *
 * The ramp rises along `+Z` from the floor at the origin to its `rise`, at the
 * drawn slope, then runs level for a landing. The `slope` is the walking
 * surface, its frame at the middle of the incline with `+Y` square to it; `top`
 * is the edge where the incline meets the landing.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The ramp.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeRamp.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRamp.Affordance, AutoMovieArchetypeRamp.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRamp.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeRamp.Dimension>(
      "ramp",
      AutoMovieArchetypeRamp.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeRamp.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeRamp.BANDS,
  );
  const run: number = d.rise / d.slope;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeRamp.Affordance,
    AutoMovieArchetypeRamp.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "ramp",
    draw,
  });

  // The incline: a thin slab whose upper face lies in the slope, which runs from the floor at z = 0 to the rise at z = run.
  const length: number = Math.hypot(run, d.rise);
  const normal: { y: number; z: number } = {
    y: run / length,
    z: -d.rise / length,
  };
  const middle: { y: number; z: number } = { y: d.rise / 2, z: run / 2 };

  // The slab's thickness is picture only. A slab of any thickness laid from the very foot would dip under the floor, so it starts where its lower edge meets the floor, a millimetre clear: the toe it leaves out is lower than the slab is thick.
  const slab: number = 0.01;
  const toe: number = slab / d.slope + 0.001;
  const centre: number = (toe + length) / 2;
  builder.box(
    "incline",
    Vector3.create(d.width, slab, length - toe),
    Vector3.create(
      0,
      (centre * d.rise) / length - (normal.y * slab) / 2,
      (centre * run) / length - (normal.z * slab) / 2,
    ),
    {
      color: "#b9b4a8",
      rotation: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, 0, 0),
        Vector3.create(0, normal.y, normal.z),
        Vector3.create(1, 0, 0),
      ).rotation,
    },
  );

  // What carries the slab between its foot and the landing: a block under its upper half, whose front edge meets the slab's lower face at the middle of the incline.
  builder.box(
    "support",
    Vector3.create(d.width, d.rise / 2 - slab, run / 2),
    Vector3.create(0, d.rise / 4 - slab / 2, (run * 3) / 4),
    { color: "#b9b4a8" },
  );
  builder.box(
    "landing",
    Vector3.create(d.width, d.rise, AutoMovieArchetypeRamp.LANDING),
    Vector3.create(0, d.rise / 2, run + AutoMovieArchetypeRamp.LANDING / 2),
    { color: "#b9b4a8" },
  );
  builder.affordance({
    id: "slope",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, middle.y, middle.z),
      Vector3.create(0, normal.y, normal.z),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    width: d.width,
    depth: length,
  });
  builder.affordance({
    id: "top",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, d.rise, run),
      Vector3.create(0, 1, 0),
      Vector3.create(-1, 0, 0),
    ),
    extent: null,
    length: d.width,
  });
  builder.affordance({
    id: "landing",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, d.rise, run + AutoMovieArchetypeRamp.LANDING / 2),
    ),
    extent: null,
    width: d.width,
    depth: AutoMovieArchetypeRamp.LANDING,
  });
  return builder.build(d.mass);
}
}

/** Companion types and bands of {@link createRamp}. */
export namespace AutoMovieArchetypeRamp {
  /**
   * The landing's length, metres: the 60 in (1525 mm) minimum of 2010 ADA
   * Standards 405.7.3.
   */
  export const LANDING: number = 1.525;

  /**
   * The affordance ids:
   *
   * - `slope`: the incline's walking surface.
   * - `top`: the edge between the incline and the landing, facing down the ramp.
   * - `landing`: the level landing at the top.
   */
  export type Affordance = "slope" | "top" | "landing";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `slope`: rise over run, a ratio.
   * - `rise`: the landing above the floor.
   * - `width`: the clear width.
   * - `mass`: kilograms.
   */
  export type Dimension = "slope" | "rise" | "width" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    slope: "",
    rise: "m",
    width: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `ramp` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    slope: AutoMovieArchetypeBand.of(
      "",
      1 / 20,
      1 / 12,
      `${ADA} 405.2, a ramp run no steeper than 1:12; a surface no steeper than 1:20 is a walk, not a ramp (106.5, the definition of a ramp, not re-read)`,
    ),
    rise: AutoMovieArchetypeBand.of(
      "m",
      0.15,
      0.76,
      `${ADA} 405.6, a run rises at most 30 in (760 mm); 405.8 requires handrails above 6 in (150 mm), taken as the least rise worth a ramp`,
    ),
    width: AutoMovieArchetypeBand.of(
      "m",
      0.915,
      1.2,
      `${ADA} 405.5, clear width at least 36 in (915 mm); the upper end is an estimate`,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      200,
      600,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
