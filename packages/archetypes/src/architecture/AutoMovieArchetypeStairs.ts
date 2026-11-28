import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeStairsData } from "./internal/AutoMovieArchetypeStairsData";

/**
 * Creates straight flights with numbered nosings and optional handrail contacts.
 */
export namespace AutoMovieArchetypeStairs {
/**
 * Creates a straight flight rising along `+Z`, with a level landing at its top.
 *
 * Use `step1` onward as the nosing contacts. The first sits at `z = 0`. Each
 * subsequent one rises by `riser` and advances by `tread`. The final nosing
 * begins the landing. Each selected handrail exposes its sloped gripping run.
 *
 * @param params Riser count, rail sides, occupancy, ID and fixed dimensions.
 *   The default has 12 risers and rails on both sides.
 * @param seed Draws the omitted occupancy and free dimensions. Omit the seed
 *   for `under50` and the midpoint of each free band.
 * @returns The composite flight with body mass equal to `mass` times `steps`.
 * @throws {AutoMovieArchetypeRefusal} If steps is not an integer from 2 to 20,
 *   a rail or occupancy is unknown, or a fixed free dimension is invalid.
 */
export function create(
  params: AutoMovieArchetypeStairs.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeStairs.Affordance, AutoMovieArchetypeStairs.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStairs.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeStairs.Dimension>(
      "stairs",
      AutoMovieArchetypeStairs.UNITS,
      seed,
      params,
    );
  const requested: number = params.steps ?? 12;
  const stepNumbers: number[] = Array.from(
    { length: Math.min(requested, AutoMovieArchetypeStairs.STEPS) },
    (_: unknown, index: number): number => index + 1,
  );
  const steps: number = stepNumbers.length;
  if (steps < 2 || steps !== requested)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "stairs",
      axis: "steps",
      value: requested,
      feasible: {
        kind: "range",
        minimum: 2,
        maximum: AutoMovieArchetypeStairs.STEPS,
        unit: "",
      },
      reason: `a flight has 2 to ${AutoMovieArchetypeStairs.STEPS} risers between landings, not ${requested}`,
      fix: "give a whole number of risers, and join flights with landings for a taller rise",
    });
  const rail: AutoMovieArchetypeStairs.Rail = ArchetypeDraw.choice(
    "stairs",
    "rail",
    params.rail ?? "both",
    AutoMovieArchetypeStairs.RAILS,
  );
  const occupancy: {
    name: AutoMovieArchetypeStairs.Occupancy | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeStairs.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeStairs.Occupancy>(
    "occupancy",
    params.occupancy,
    AutoMovieArchetypeStairs.OCCUPANCIES,
  );
  const d: Record<AutoMovieArchetypeStairs.Dimension, number> = {
    ...draw.dimensions(AutoMovieArchetypeStairs.BANDS),
    width: occupancy.figures.width!,
  };
  const { riser, tread, width }: Record<AutoMovieArchetypeStairs.Dimension, number> = d;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStairs.Affordance,
    AutoMovieArchetypeStairs.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "stairs",
    draw,
  });

  // Treads 1 to steps - 1, then the landing at the top; each nosing is the front edge of its tread.
  const landing: number = Math.min(width, AutoMovieArchetypeStairs.LANDING);
  for (const k of stepNumbers) {
    const depth: number = k === steps ? landing : tread;
    builder.box(
      k === steps ? "landing" : `step-${k}`,
      AutoMovieEngineVector3.create(width, k * riser, depth),
      AutoMovieEngineVector3.create(0, (k * riser) / 2, (k - 1) * tread + depth / 2),
      { color: "#b9b4a8" },
    );
    builder.affordance({
      id: `step${k}`,
      kind: "ledge",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(0, k * riser, (k - 1) * tread),
        AutoMovieEngineVector3.create(0, 1, 0),
        AutoMovieEngineVector3.create(-1, 0, 0),
      ),
      extent: null,
      length: width,
    });
  }
  builder.affordance({
    id: "landing",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(
      AutoMovieEngineVector3.create(0, steps * riser, (steps - 1) * tread + landing / 2),
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
    const x: number = sign * (width / 2 - AutoMovieArchetypeStairs.CLEARANCE - radius);
    const low: IAutoMovieVector3 = AutoMovieEngineVector3.create(
      x,
      d.railHeight - drop,
      -tread,
    );
    const high: IAutoMovieVector3 = AutoMovieEngineVector3.create(
      x,
      steps * riser + d.railHeight - drop,
      top,
    );
    const end: IAutoMovieVector3 = AutoMovieEngineVector3.create(
      x,
      high.y,
      top + AutoMovieArchetypeStairs.EXTENSION,
    );
    builder.rod(`rail-${side}`, radius, low, high, { color: "#55595f" });
    builder.rod(`rail-top-${side}`, radius, high, end, { color: "#55595f" });
    builder.rod(`post-low-${side}`, radius, AutoMovieEngineVector3.create(x, 0, -tread), low, {
      color: "#55595f",
    });
    builder.rod(
      `post-high-${side}`,
      radius,
      AutoMovieEngineVector3.create(x, steps * riser, end.z),
      end,
      { color: "#55595f" },
    );
    builder.affordance({
      id: `${side}Rail`,
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(low, high), 0.5),
        AutoMovieEngineVector3.create(0, tread, -riser),
        AutoMovieEngineVector3.create(0, riser, tread),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(high, low)),
    });
  }
  return builder.build(d.mass * steps);
}

  /** Handrail selection seen while facing uphill along `+Z`. */
  export type Rail = "left" | "right" | "both" | "none";

  /** Accepted `rail` values in the order `left`, `right`, `both`, `none`. */
  export const RAILS: readonly Rail[] = ["left", "right", "both", "none"];

  /** Maximum riser count per flight, 20. The minimum is 2. */
  export const STEPS: number = 20;

  /**
   * Horizontal gap from the flight edge to the outside of its rail, 0.038 m.
   */
  export const CLEARANCE: number = 0.038;

  /** Level rail extension uphill beyond the final nosing, 0.305 m. */
  export const EXTENSION: number = 0.305;

  /** Maximum landing depth along the flight, 48 in (1.2192 m). */
  export const LANDING: number = 48 * AutoMovieArchetypeUnits.INCH;

  /**
   * Names the staged contacts on the flight.
   *
   * `step1` through `step<steps>` are ledges facing `-Z`, with the last at the
   * first edge of the landing. `landing` covers the level top. `leftRail` and
   * `rightRail`, when present, are sloped bars on `+X` and `-X`.
   */
  export type Affordance =
    | `step${number}`
    | "landing"
    | "leftRail"
    | "rightRail";

  /**
   * Measurements that determine the model's flight and handrails.
   *
   * In metres, `riser` is the step height, `tread` the nosing-to-nosing run,
   * `width` the occupancy-selected flight width, `railHeight` the vertical
   * height above the nosings to the sloped bar's top, and `railDiameter` the
   * bar diameter. `mass` is kilograms per riser.
   */
  export type Dimension =
    | "riser"
    | "tread"
    | "width"
    | "railHeight"
    | "railDiameter"
    | "mass";

  /** Metres for flight and rail lengths, kilograms per riser for `mass`. */
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
   * Width class `under50` for fewer than 50 occupants or `over50` for 50 or more.
   */
  export type Occupancy = "under50" | "over50";

  /**
   * Flight widths in metres by occupancy class.
   *
   * `under50` is 0.914 m and is the seedless default. `over50` is 1.118 m.
   */
  export const OCCUPANCIES: Readonly<
    Record<Occupancy, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    under50: { width: 0.914 },
    over50: { width: 1.118 },
  };

  /**
   * Sets the flight's count, rail sides, occupancy, ID and fixed dimensions.
   *
   * Select `occupancy` to set the width. Give a fixed value from its band for
   * any of the other dimensions you need to control.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "width">, number>
  > {
    /**
     * Width class. The seed chooses an omitted class. The seedless default
     * is `under50`.
     */
    occupancy?: Occupancy;

    /**
     * Integer number of risers, 2 through 20, including the final rise onto
     * the landing. Defaults to 12.
     */
    steps?: number;

    /** Rail sides while facing uphill. Defaults to `both`. */
    rail?: Rail;

    /** Scene-unique model ID. Defaults to `stairs`. */
    id?: string;
  }

  /**
   * Inclusive intervals for dimensions that callers may fix or let the seed draw.
   *
   * Riser 0.102?0.178 m, tread 0.279?0.3302 m, rail height 0.865?0.965 m,
   * rail diameter 0.032?0.051 m and mass 30?60 kg per riser.
   */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "width">, IAutoMovieArchetypeBand>
  > = {
    riser: AutoMovieArchetypeBand.metres(
      0.102,
      0.178,
      `${AutoMovieArchetypeStairsData.IBC} 1011.5.2, risers 4 to 7 in (102 to 178 mm); ${AutoMovieArchetypeStairsData.ADA} 504.2 agrees`,
    ),
    tread: AutoMovieArchetypeBand.metres(
      0.279,
      13 * AutoMovieArchetypeUnits.INCH,
      `${AutoMovieArchetypeStairsData.IBC} 1011.5.2, treads at least 11 in (279 mm); the upper end, 13 in, is an estimate`,
      true,
    ),
    railHeight: AutoMovieArchetypeBand.metres(
      0.865,
      0.965,
      `${AutoMovieArchetypeStairsData.ADA} 505.4, gripping surface 34 to 38 in (865 to 965 mm) above the nosings; ${AutoMovieArchetypeStairsData.IBC} 1014.2 agrees`,
    ),
    railDiameter: AutoMovieArchetypeBand.metres(
      0.032,
      0.051,
      `${AutoMovieArchetypeStairsData.ADA} 505.7.1, circular gripping surface 1-1/4 to 2 in (32 to 51 mm)`,
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
