import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The maker's bike read. */
const PELOTON: string =
  "Peloton Bike user manual, specifications: 135 lb (61 kg), a 4 x 2 ft (120 x 60 cm) footprint (https://manualshive.com/en/manual/peloton/pl-01/1523449?page=7)";

/** What no source read gives. */
const UNREAD: string =
  "the Peloton manual read lists the saddle and the handlebar as adjustable but gives no figure";

/**
 * A stationary exercise bike (an indoor cycle): a frame on a floor base with a saddle, a handlebar, a crank and two pedals.
 *
 * It stands with its bottom bracket over the origin and its front toward `+Z`, the rider facing `+Z`. The `crank` turns both arms, the left one (`+X`) straight up at rest and a positive travel pedalling forward; each pedal rides it and stays level. The rider sits astride the `saddle`, behind and above the bracket, and holds `leftGrip` and `rightGrip` at the handlebar's ends.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The bike.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the bike stands, the crank's rest and sense and its contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A floor base, a seat post up to the drawn saddle height behind the bracket, a stem up to the drawn handlebar height ahead of it, the handlebar of the drawn width, and the crank of the drawn length with a level pedal on each arm, as `createBicycle` builds them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the base, posts and bar, the saddle, the grips, then the crank and its pedals.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No flywheel or resistance knob; the posts stand upright; the parts' sizes are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms About ten parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createExerciseBike(
  params: createExerciseBike.IParams = {},
  seed?: number | string,
): Archetype<createExerciseBike.Affordance, createExerciseBike.Dimension> {
  const d: Record<createExerciseBike.Dimension, number> =
    ArchetypeDraw.dimensions(
      "exerciseBike",
      createExerciseBike.BANDS,
      seed,
      params,
    );
  const builder: ArchetypeBuilder<
    createExerciseBike.Affordance,
    createExerciseBike.Dimension
  > = new ArchetypeBuilder({
    archetype: "exerciseBike",
    id: params.id,
    name: "exercise bike",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const bracket: number = createExerciseBike.BRACKET;
  const tube: number = createExerciseBike.TUBE;
  const steel: string = "#55595f";
  const saddle: IAutoMovieVector3 = v(
    0,
    d.saddleHeight,
    -createExerciseBike.SETBACK,
  );
  const bars: IAutoMovieVector3 = v(
    0,
    d.handlebarHeight,
    createExerciseBike.REACH,
  );
  builder.box("base", v(createExerciseBike.FOOTPRINT.width, 0.06, createExerciseBike.FOOTPRINT.length), v(0, 0.03, 0), { color: "#2c2f33" });
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
    v(d.saddleWidth, 0.03, createExerciseBike.SADDLE),
    v(0, saddle.y - 0.015, saddle.z),
    {
      color: "#22262b",
    },
  );
  builder.affordance({
    id: "saddle",
    kind: "seat",
    frame: ArchetypeFrame.upright(
      v(0, saddle.y, saddle.z + createExerciseBike.SADDLE / 2),
    ),
    extent: null,
    depth: createExerciseBike.SADDLE,
    width: d.saddleWidth,
    astride: true,
  });
  const grip: number = createExerciseBike.GRIP;
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
      frame: ArchetypeFrame.upright(
        v(sign * (d.handlebarWidth / 2 - 0.06), bars.y, bars.z),
      ),
      extent: null,
      grip: "power",
      aperture: grip,
      length: 0.12,
    });
  const half: number = createExerciseBike.STANCE / 2;
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
    frame: ArchetypeFrame.facing(v(half, bracket, 0), v(1, 0, 0), v(0, 1, 0)),
    extent: null,
    radius: d.crank,
    parts: ["crank-left", "crank-right"],
  });
  const pedal: Readonly<{ width: number; depth: number }> =
    createExerciseBike.PEDAL;
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
      frame: ArchetypeFrame.upright(at),
      extent: null,
      width: pedal.width,
      depth: pedal.depth,
      parts: [`pedal-${sign === 1 ? "left" : "right"}`],
      rides: "crank",
    });
  }
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createExerciseBike}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension a rider sets or a maker varies; the saddle's height is the one a seated workout reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The saddle, the grips, the crank and the pedals, named as `createBicycle` names them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mass and the footprint are a maker's as read; no source read gives the saddle's, the handlebar's or the crank's settings, so those bands are provisional; the parts' sizes are named estimates.
 */
export namespace createExerciseBike {
  /** The floor footprint, metres: the Peloton Bike's 120 x 60 cm (see the source). */
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

  /** Each pedal's plate, metres: as `createBicycle`'s. */
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

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `exerciseBike` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    saddleHeight: ArchetypeBand.metres(0.8, 1.05, UNREAD, true),
    handlebarHeight: ArchetypeBand.metres(0.95, 1.2, UNREAD, true),
    handlebarWidth: ArchetypeBand.metres(0.45, 0.55, UNREAD, true),
    saddleWidth: ArchetypeBand.metres(0.14, 0.18, UNREAD, true),
    crank: ArchetypeBand.metres(
      0.165,
      0.175,
      "the common 165 to 175 mm crank arms; the Peloton manual read gives no crank length",
      true,
    ),
    mass: ArchetypeBand.of("kg", 61, 61, PELOTON),
  };
}