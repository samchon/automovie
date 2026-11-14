import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The accessibility standard's ramp clauses. */
const ADA: string =
  "2010 ADA Standards (https://www.access-board.gov/ada/chapter/ch04/)";

/**
 * A ramp with its top landing.
 *
 * The ramp rises along `+Z` from the floor at the origin to its `rise`, at the drawn slope, then runs level for a landing. The `slope` is the walking surface, its frame at the middle of the incline with `+Y` square to it; `top` is the edge where the incline meets the landing.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The ramp.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the ramp's direction, origin and the two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The run is the rise divided by the slope; the incline is a thin slab whose upper face lies in the slope, from where its lower edge meets the floor to the landing's edge, over a block under its upper half, and the landing a box at the rise; no part reaches below the floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, derive the run, three parts and three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No handrail here: a ramp that needs one takes a `createBar` rail beside it. The incline is not a solid wedge, which no primitive is: the slab leaves out the toe lower than its own thickness and stands open under its lower half, while the `slope` surface covers the whole incline from the floor.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createRamp(
  params: createRamp.IParams = {},
  seed?: number | string,
): Archetype<createRamp.Affordance, createRamp.Dimension> {
  const d: Record<createRamp.Dimension, number> = ArchetypeDraw.dimensions(
    "ramp",
    createRamp.BANDS,
    seed,
    params,
  );
  const run: number = d.rise / d.slope;
  const builder: ArchetypeBuilder<createRamp.Affordance, createRamp.Dimension> =
    new ArchetypeBuilder({
      archetype: "ramp",
      id: params.id,
      name: "ramp",
      dimensions: d,
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
      rotation: ArchetypeFrame.facing(
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
    Vector3.create(d.width, d.rise, createRamp.LANDING),
    Vector3.create(0, d.rise / 2, run + createRamp.LANDING / 2),
    { color: "#b9b4a8" },
  );
  builder.affordance({
    id: "slope",
    kind: "surface",
    frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.upright(
      Vector3.create(0, d.rise, run + createRamp.LANDING / 2),
    ),
    extent: null,
    width: d.width,
    depth: createRamp.LANDING,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createRamp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation The slope is a ratio of rise to run, as the standard states it; one cited band per dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The slope, the rise and the width a walking act reads (#3371).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The run is derived, never stated beside the slope and rise it follows from.
 */
export namespace createRamp {
  /** The landing's length, metres: the 60 in (1525 mm) minimum of 2010 ADA Standards 405.7.3. */
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

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `ramp` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    slope: ArchetypeBand.of(
      "",
      1 / 20,
      1 / 12,
      `${ADA} 405.2, a ramp run no steeper than 1:12; a surface no steeper than 1:20 is a walk, not a ramp (106.5, the definition of a ramp, not re-read)`,
    ),
    rise: ArchetypeBand.of(
      "m",
      0.15,
      0.76,
      `${ADA} 405.6, a run rises at most 30 in (760 mm); 405.8 requires handrails above 6 in (150 mm), taken as the least rise worth a ramp`,
    ),
    width: ArchetypeBand.of(
      "m",
      0.915,
      1.2,
      `${ADA} 405.5, clear width at least 36 in (915 mm); the upper end is an estimate`,
      true,
    ),
    mass: ArchetypeBand.of("kg", 200, 600, ArchetypeBand.TYPICAL_MASS, true),
  };
}
