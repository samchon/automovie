import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/**
 * The building code's stair clauses, read in a state adoption of the model
 * code.
 */
const IBC: string =
  "IBC 2021, read in its Illinois adoption (https://up.codes/viewer/illinois/ibc-2021/chapter/10/means-of-egress)";

/** The accessibility standard's handrail clauses. */
const ADA: string =
  "2010 ADA Standards (https://www.access-board.gov/ada/chapter/ch05/)";

/**
 * A straight flight of stairs with its top landing and its handrails.
 *
 * The flight rises along `+Z` from the floor at the origin: the first riser
 * stands at `z = 0`, and each of the `steps` risers lifts by the same `riser`
 * onto a tread of the same `tread` depth, the last onto the landing. Every
 * nosing is a `ledge` named `step1` upward, facing down the flight, so a foot
 * is placed from the nosing by the tread's depth. A handrail is a `bar` along
 * the flight's slope at the rail height above the line of the nosings, on the
 * climber's left (`+X`) or right.
 *
 * @param params The number of risers, the rails, the occupant class and any
 *   dimension the author fixes.
 * @param seed The seed that draws the occupant class when it is not given and
 *   every dimension left free inside its band; absent, the first class and the
 *   middle of each band.
 * @returns The flight.
 * @throws {AutoMovieArchetypeRefusal} For an occupant class the code does not
 *   list, a fixed dimension outside its band, or a number of risers that is not
 *   a whole number from 2 to 20.
 */
export function createStairs(
  params: createStairs.IParams = {},
  seed?: number,
): AutoMovieArchetype<createStairs.Affordance, createStairs.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createStairs.Dimension> =
    new AutoMovieArchetypeDrawSession<createStairs.Dimension>(
      "stairs",
      createStairs.UNITS,
      seed,
      params,
    );
  const steps: number = params.steps ?? 12;
  if (steps < 2 || steps > createStairs.STEPS)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "stairs",
      axis: "steps",
      value: steps,
      feasible: {
        kind: "range",
        minimum: 2,
        maximum: createStairs.STEPS,
        unit: "",
      },
      reason: `a flight has 2 to ${createStairs.STEPS} risers between landings, not ${steps}`,
      fix: "give a whole number of risers, and join flights with landings for a taller rise",
    });
  const rail: createStairs.Rail = ArchetypeDraw.choice(
    "stairs",
    "rail",
    params.rail ?? "both",
    createStairs.RAILS,
  );
  const occupancy: {
    name: createStairs.Occupancy | undefined;
    figures: Readonly<Partial<Record<createStairs.Dimension, number>>>;
  } = draw.model<createStairs.Occupancy>(
    "occupancy",
    params.occupancy,
    createStairs.OCCUPANCIES,
  );
  const d: Record<createStairs.Dimension, number> = {
    ...draw.dimensions(createStairs.BANDS),
    width: occupancy.figures.width!,
  };
  const { riser, tread, width }: Record<createStairs.Dimension, number> = d;
  const builder: AutoMovieArchetypeBuilder<
    createStairs.Affordance,
    createStairs.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "stairs",
    draw,
  });

  // Treads 1 to steps - 1, then the landing at the top; each nosing is the front edge of its tread.
  const landing: number = Math.min(width, createStairs.LANDING);
  for (let k: number = 1; k <= steps; k++) {
    const depth: number = k === steps ? landing : tread;
    builder.box(
      k === steps ? "landing" : `step-${k}`,
      Vector3.create(width, k * riser, depth),
      Vector3.create(0, (k * riser) / 2, (k - 1) * tread + depth / 2),
      { color: "#b9b4a8" },
    );
    builder.affordance({
      id: `step${k}`,
      kind: "ledge",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, k * riser, (k - 1) * tread),
        Vector3.create(0, 1, 0),
        Vector3.create(-1, 0, 0),
      ),
      extent: null,
      length: width,
    });
  }
  builder.affordance({
    id: "landing",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, steps * riser, (steps - 1) * tread + landing / 2),
    ),
    extent: null,
    width,
    depth: landing,
  });

  // A rail: the sloped run above the nosing line, its level top extension, and a post at each end.
  const radius: number = d.railDiameter / 2;
  const top: number = (steps - 1) * tread;

  // The rail's axis lies below the top of its gripping surface by its radius measured vertically, which on the slope is the radius over the slope's cosine.
  const drop: number = (radius * Math.hypot(riser, tread)) / tread;
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    if (rail !== "both" && rail !== side) continue;
    const x: number = sign * (width / 2 - createStairs.CLEARANCE - radius);
    const low: IAutoMovieVector3 = Vector3.create(
      x,
      d.railHeight - drop,
      -tread,
    );
    const high: IAutoMovieVector3 = Vector3.create(
      x,
      steps * riser + d.railHeight - drop,
      top,
    );
    const end: IAutoMovieVector3 = Vector3.create(
      x,
      high.y,
      top + createStairs.EXTENSION,
    );
    builder.rod(`rail-${side}`, radius, low, high, { color: "#55595f" });
    builder.rod(`rail-top-${side}`, radius, high, end, { color: "#55595f" });
    builder.rod(`post-low-${side}`, radius, Vector3.create(x, 0, -tread), low, {
      color: "#55595f",
    });
    builder.rod(
      `post-high-${side}`,
      radius,
      Vector3.create(x, steps * riser, end.z),
      end,
      { color: "#55595f" },
    );
    builder.affordance({
      id: `${side}Rail`,
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.scale(Vector3.add(low, high), 0.5),
        Vector3.create(0, tread, -riser),
        Vector3.create(0, riser, tread),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: Vector3.length(Vector3.subtract(high, low)),
    });
  }
  return builder.build(d.mass * steps);
}

/** Companion types and bands of {@link createStairs}. */
export namespace createStairs {
  /** Which sides have a handrail. */
  export type Rail = "left" | "right" | "both" | "none";

  /** Every rail choice, for a caller that reads one at run time. */
  export const RAILS: readonly Rail[] = ["left", "right", "both", "none"];

  /**
   * The most risers in one flight: at the tallest riser, 178 mm, twenty rise
   * 3560 mm, under the 3658 mm of IBC 2021 1011.8.
   */
  export const STEPS: number = 20;

  /**
   * A rail's clearance from the stair's side, metres: the 1-1/2 in (38 mm) of
   * 2010 ADA Standards 505.5.
   */
  export const CLEARANCE: number = 0.038;

  /**
   * A rail's level run beyond the top riser, metres: the 12 in (305 mm) of 2010
   * ADA Standards 505.10.2.
   */
  export const EXTENSION: number = 0.305;

  /**
   * The greatest depth of the top landing along the flight, metres, 48 in: the
   * landing is as deep as the flight is wide, up to this. An estimate, not read
   * at a source.
   */
  export const LANDING: number = 48 * AutoMovieArchetypeUnits.INCH;

  /**
   * The affordance ids:
   *
   * - `step1` to `step<steps>`: each nosing from the bottom up, an edge across
   *   the flight facing down it; the last is the landing's edge.
   * - `landing`: the top landing.
   * - `leftRail`, `rightRail`: the handrails on `+X` and `-X`, each a bar along
   *   the slope.
   */
  export type Affordance =
    | `step${number}`
    | "landing"
    | "leftRail"
    | "rightRail";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `riser`: the rise of every step.
   * - `tread`: the going of every step, nosing to nosing.
   * - `width`: the flight's least width, its occupant class's.
   * - `railHeight`: the top of a rail's gripping surface above the line of the
   *   nosings, measured vertically.
   * - `railDiameter`: a rail's round section.
   * - `mass`: kilograms per riser.
   */
  export type Dimension =
    | "riser"
    | "tread"
    | "width"
    | "railHeight"
    | "railDiameter"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    riser: "m",
    tread: "m",
    width: "m",
    railHeight: "m",
    railDiameter: "m",
    mass: "kg",
  };

  /**
   * The code's occupant classes for a stair's width: under 50 occupants, and 50
   * or more.
   */
  export type Occupancy = "under50" | "over50";

  /**
   * Each class's least width, metres, the default first: IBC 2021 1011.2, "36
   * in (914 mm)" under 50 occupants and "44 in (1118 mm)" otherwise.
   */
  export const OCCUPANCIES: Readonly<
    Record<Occupancy, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    under50: { width: 0.914 },
    over50: { width: 1.118 },
  };

  /**
   * The parameters: the count, the rails, the occupant class, and any free
   * dimension fixed to a value inside its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "width">, number>
  > {
    /**
     * The occupant class the flight's width serves; drawn from the seed when
     * absent.
     */
    occupancy?: Occupancy;

    /** How many risers the flight has, 2 to 20; 12 when absent. */
    steps?: number;

    /** Which sides have a handrail; both when absent. */
    rail?: Rail;

    /** The model's id, unique in a scene; `stairs` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "width">, IAutoMovieArchetypeBand>
  > = {
    riser: AutoMovieArchetypeBand.metres(
      0.102,
      0.178,
      `${IBC} 1011.5.2, risers 4 to 7 in (102 to 178 mm); ${ADA} 504.2 agrees`,
    ),
    tread: AutoMovieArchetypeBand.metres(
      0.279,
      13 * AutoMovieArchetypeUnits.INCH,
      `${IBC} 1011.5.2, treads at least 11 in (279 mm); the upper end, 13 in, is an estimate`,
      true,
    ),
    railHeight: AutoMovieArchetypeBand.metres(
      0.865,
      0.965,
      `${ADA} 505.4, gripping surface 34 to 38 in (865 to 965 mm) above the nosings; ${IBC} 1014.2 agrees`,
    ),
    railDiameter: AutoMovieArchetypeBand.metres(
      0.032,
      0.051,
      `${ADA} 505.7.1, circular gripping surface 1-1/4 to 2 in (32 to 51 mm)`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      30,
      60,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
