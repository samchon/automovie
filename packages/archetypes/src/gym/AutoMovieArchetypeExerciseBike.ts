import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The maker's bike read. */
const PELOTON: string =
  "Peloton Bike user manual, specifications: 135 lb (61 kg), a 4 x 2 ft (120 x 60 cm) footprint (https://manualshive.com/en/manual/peloton/pl-01/1523449?page=7)";

/** What no source read gives. */
const UNREAD: string =
  "the Peloton manual read lists the saddle and the handlebar as adjustable but gives no figure";

/** Constructs the exercise bike archetype from its recipe. */
export namespace AutoMovieArchetypeExerciseBike {
/**
 * A stationary exercise bike (an indoor cycle): a frame on a floor base with a
 * saddle, a handlebar, a crank and two pedals.
 *
 * It stands with its bottom bracket over the origin and its front toward `+Z`,
 * the rider facing `+Z`. The `crank` turns both arms, the left one (`+X`)
 * straight up at rest and a positive travel pedalling forward; each pedal rides
 * it and stays level. The rider sits astride the `saddle`, behind and above the
 * bracket, and holds `leftGrip` and `rightGrip` at the handlebar's ends.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The bike.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeExerciseBike.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeExerciseBike.Affordance,
  AutoMovieArchetypeExerciseBike.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeExerciseBike.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeExerciseBike.Dimension>(
      "exerciseBike",
      AutoMovieArchetypeExerciseBike.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeExerciseBike.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeExerciseBike.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeExerciseBike.Affordance,
    AutoMovieArchetypeExerciseBike.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "exercise bike",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const bracket: number = AutoMovieArchetypeExerciseBike.BRACKET;
  const tube: number = AutoMovieArchetypeExerciseBike.TUBE;
  const steel: string = "#55595f";
  const saddle: IAutoMovieVector3 = v(
    0,
    d.saddleHeight,
    -AutoMovieArchetypeExerciseBike.SETBACK,
  );
  const bars: IAutoMovieVector3 = v(
    0,
    d.handlebarHeight,
    AutoMovieArchetypeExerciseBike.REACH,
  );
  builder.box(
    "base",
    v(
      AutoMovieArchetypeExerciseBike.FOOTPRINT.width,
      0.06,
      AutoMovieArchetypeExerciseBike.FOOTPRINT.length,
    ),
    v(0, 0.03, 0),
    { color: "#2c2f33" },
  );
  builder.rod(
    "seatPost",
    tube,
    v(0, 0.06, saddle.z),
    v(0, saddle.y - 0.03, saddle.z),
    { color: steel },
  );
  builder.rod("stem", tube, v(0, 0.06, bars.z), v(0, bars.y, bars.z), {
    color: steel,
  });
  builder.rod("downTube", tube, v(0, bracket, 0), v(0, bracket, bars.z), {
    color: steel,
  });
  builder.box(
    "saddle",
    v(d.saddleWidth, 0.03, AutoMovieArchetypeExerciseBike.SADDLE),
    v(0, saddle.y - 0.015, saddle.z),
    {
      color: "#22262b",
    },
  );
  builder.affordance({
    id: "saddle",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.upright(
      v(0, saddle.y, saddle.z + AutoMovieArchetypeExerciseBike.SADDLE / 2),
    ),
    extent: null,
    depth: AutoMovieArchetypeExerciseBike.SADDLE,
    width: d.saddleWidth,
    astride: true,
  });
  const grip: number = AutoMovieArchetypeExerciseBike.GRIP;
  builder.rod(
    "handlebar",
    grip / 2,
    v(-d.handlebarWidth / 2, bars.y, bars.z),
    v(d.handlebarWidth / 2, bars.y, bars.z),
    {
      color: "#1d1f22",
    },
  );
  for (const [id, sign] of [
    ["leftGrip", 1],
    ["rightGrip", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.upright(
        v(sign * (d.handlebarWidth / 2 - 0.06), bars.y, bars.z),
      ),
      extent: null,
      grip: "power",
      aperture: grip,
      length: 0.12,
    });
  const half: number = AutoMovieArchetypeExerciseBike.STANCE / 2;
  builder.rod(
    "crank-left",
    0.01,
    v(half, bracket, 0),
    v(half, bracket + d.crank, 0),
    { color: "#8a8d91" },
  );
  builder.rod(
    "crank-right",
    0.01,
    v(-half, bracket, 0),
    v(-half, bracket - d.crank, 0),
    { color: "#8a8d91" },
  );
  builder.affordance({
    id: "crank",
    kind: "crank",
    frame: AutoMovieArchetypeFrame.facing(
      v(half, bracket, 0),
      v(1, 0, 0),
      v(0, 1, 0),
    ),
    extent: null,
    radius: d.crank,
    parts: ["crank-left", "crank-right"],
  });
  const pedal: Readonly<{ width: number; depth: number }> =
    AutoMovieArchetypeExerciseBike.PEDAL;
  for (const [id, sign] of [
    ["leftPedal", 1],
    ["rightPedal", -1],
  ] as const) {
    const at: IAutoMovieVector3 = v(
      sign * (half + pedal.width / 2),
      bracket + sign * d.crank,
      0,
    );
    builder.box(
      `pedal-${sign === 1 ? "left" : "right"}`,
      v(pedal.width, 0.02, pedal.depth),
      v(at.x, at.y - 0.01, at.z),
      {
        color: "#22262b",
      },
    );
    builder.affordance({
      id,
      kind: "pedal",
      frame: AutoMovieArchetypeFrame.upright(at),
      extent: null,
      width: pedal.width,
      depth: pedal.depth,
      parts: [`pedal-${sign === 1 ? "left" : "right"}`],
      rides: "crank",
    });
  }
  return builder.build(d.mass);
}
}

/** Companion types, constants and bands of {@link createExerciseBike}. */
export namespace AutoMovieArchetypeExerciseBike {
  /**
   * The floor footprint, metres: the Peloton Bike's 120 x 60 cm (see the
   * source).
   */
  export const FOOTPRINT: Readonly<{ length: number; width: number }> = {
    length: 1.2,
    width: 0.6,
  };

  /** The bottom bracket's height above the floor, metres: an estimate. */
  export const BRACKET: number = 0.3;

  /** The posts' radius, metres: an estimate. */
  export const TUBE: number = 0.025;

  /** The saddle behind the bracket, metres: an estimate. */
  export const SETBACK: number = 0.2;

  /** The handlebar ahead of the bracket, metres: an estimate. */
  export const REACH: number = 0.45;

  /** The saddle's length, metres: an estimate. */
  export const SADDLE: number = 0.26;

  /** The handlebar's diameter, metres: an estimate. */
  export const GRIP: number = 0.03;

  /** The pedals' stance, metres: an estimate. */
  export const STANCE: number = 0.16;

  /** Each pedal's plate, metres: as `AutoMovieArchetypeBicycle`'s. */
  export const PEDAL: Readonly<{ width: number; depth: number }> = {
    width: 0.09,
    depth: 0.08,
  };

  /**
   * The affordance ids:
   *
   * - `saddle`: the saddle, sat astride, `+Z` the way the rider faces.
   * - `leftGrip`, `rightGrip`: the handlebar's ends, taken from above.
   * - `crank`: the crank's axle, out of the left side.
   * - `leftPedal`, `rightPedal`: the pedals, riding the crank.
   */
  export type Affordance =
    | "saddle"
    | "leftGrip"
    | "rightGrip"
    | "crank"
    | "leftPedal"
    | "rightPedal";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `saddleHeight`: the saddle's top above the floor.
   * - `handlebarHeight`: the handlebar's axis above the floor.
   * - `handlebarWidth`: end to end.
   * - `saddleWidth`: the saddle's.
   * - `crank`: the arm's length.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "saddleHeight"
    | "handlebarHeight"
    | "handlebarWidth"
    | "saddleWidth"
    | "crank"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    saddleHeight: "m",
    handlebarHeight: "m",
    handlebarWidth: "m",
    saddleWidth: "m",
    crank: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `exerciseBike` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    saddleHeight: AutoMovieArchetypeBand.metres(0.8, 1.05, UNREAD, true),
    handlebarHeight: AutoMovieArchetypeBand.metres(0.95, 1.2, UNREAD, true),
    handlebarWidth: AutoMovieArchetypeBand.metres(0.45, 0.55, UNREAD, true),
    saddleWidth: AutoMovieArchetypeBand.metres(0.14, 0.18, UNREAD, true),
    crank: AutoMovieArchetypeBand.metres(
      0.165,
      0.175,
      "the common 165 to 175 mm crank arms; the Peloton manual read gives no crank length",
      true,
    ),
    mass: AutoMovieArchetypeBand.of("kg", 61, 61, PELOTON),
  };
}
