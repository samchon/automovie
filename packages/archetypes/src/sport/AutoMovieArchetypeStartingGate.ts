import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeStartingGateData } from "./internal/AutoMovieArchetypeStartingGateData";

/** Constructs the starting gate archetype from its recipe. */
export namespace AutoMovieArchetypeStartingGate {
/**
 * A horse-racing starting gate: a row of stalls between padded partitions under
 * an overhead frame, each with a pair of front doors that open together and a
 * rear door a horse is loaded through.
 *
 * The gate stands on level ground with the middle of its front at the origin,
 * facing `+Z`, the way the field runs; the stalls reach back toward `-Z` by the
 * stall's depth, numbered from `-X` to `+X`. The stall pitch is the 20-stall
 * Derby gate's 65 feet over its stalls. Each stall's two front leaves meet at
 * its middle, each hinged at its partition; `door0` is the first stall's leaf
 * on `-X` and every other front leaf follows it, so one travel opens the whole
 * front together up to 90 degrees, where each leaf lies along its partition and
 * the stall's full clear width is open toward `+Z`. `rear<k>` is the k-th
 * stall's rear door, hinged at its `+X` partition and swinging back toward `-Z`
 * as far, set independently for loading. `stall<k>` is the floor of the k-th
 * stall where a horse stands, facing `+Z`.
 *
 * @param params The number of stalls and any dimension the author fixes.
 * @param seed The seed that draws every free dimension inside its band; absent,
 *   the middle of each band.
 * @returns The gate.
 * @throws {AutoMovieArchetypeRefusal} For a number of stalls that is not a
 *   whole number from 1 to 20, or a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeStartingGate.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStartingGate.Affordance,
  AutoMovieArchetypeStartingGate.Dimension
> {
  const requested: number = params.stalls ?? AutoMovieArchetypeStartingGate.STALLS;
  const row: number[] = Array.from(
    { length: Math.min(requested, AutoMovieArchetypeStartingGate.MOST_STALLS) },
    (_: unknown, index: number): number => index,
  );
  const stalls: number = row.length;
  if (stalls === 0 || stalls !== requested)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "startingGate",
      axis: "stalls",
      value: requested,
      feasible: {
        kind: "range",
        minimum: 1,
        maximum: AutoMovieArchetypeStartingGate.MOST_STALLS,
        unit: "",
      },
      reason: `a gate of ${requested} stalls is not a whole number from 1 to ${AutoMovieArchetypeStartingGate.MOST_STALLS}`,
      fix: "give a whole number of stalls a racing gate carries",
    });
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStartingGate.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeStartingGate.Dimension>(
      "startingGate",
      AutoMovieArchetypeStartingGate.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeStartingGate.Dimension, number> = {
    ...draw.dimensions(AutoMovieArchetypeStartingGate.BANDS),
    pitch: AutoMovieArchetypeStartingGate.PITCH,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStartingGate.Affordance,
    AutoMovieArchetypeStartingGate.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: `starting gate of ${stalls} stalls`,
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const width: number = stalls * d.pitch;
  const clear: number = d.pitch - d.partition;
  const leaf: number = clear / 2;
  const door: number = d.doorFoot + d.doorHeight / 2;
  const post: number = d.partition / 2;

  // The overhead frame: a beam over the front and one over the back.
  for (const [part, z] of [
    ["beam-front", 0],
    ["beam-rear", -d.depth],
  ] as const)
    builder.box(
      part,
      v(width + d.partition, d.partition, d.partition),
      v(0, d.height - d.partition / 2, z),
      { color: "#d8d8d8" },
    );

  // Each partition: a padded panel between a front and a rear post.
  for (let k: number = 0; k <= stalls; ++k) {
    const x: number = (k - stalls / 2) * d.pitch;
    builder.box(
      `partition${k}`,
      v(d.partition, d.doorHeight, d.depth),
      v(x, door, -d.depth / 2),
      { color: "#2f6b3a" },
    );
    for (const [end, z] of [
      ["front", 0],
      ["rear", -d.depth],
    ] as const)
      builder.rod(`post${k}-${end}`, post, v(x, 0, z), v(x, d.height, z), {
        color: "#d8d8d8",
      });
  }

  // Each stall: two front leaves hinged at its partitions, a rear door and its floor.
  for (const k of row) {
    const middle: number = (k + 0.5 - stalls / 2) * d.pitch;
    for (const [index, sign] of [
      [2 * k, -1],
      [2 * k + 1, 1],
    ] as const) {
      const id: `door${number}` = `door${index}`;
      const hinge: number = middle + (sign * clear) / 2;
      builder.box(
        `leaf${index}`,
        v(leaf, d.doorHeight, d.leafThickness),
        v(middle + (sign * leaf) / 2, door, 0),
        { color: "#c8102e" },
      );
      builder.affordance({
        id,
        kind: "hinge",

        // The axis turns the leaf, which reaches from its hinge toward the
        // stall's middle, out toward +Z under a positive travel.
        frame: AutoMovieArchetypeFrame.facing(
          v(hinge, door, 0),
          v(0, sign, 0),
          v(-sign, 0, 0),
        ),
        extent: null,
        travel: AutoMovieArchetypeStartingGate.SWING,
        parts: [`leaf${index}`],
        ...(index === 0 ? {} : { follows: { id: "door0", ratio: 1 } }),
      });
    }
    builder.box(
      `rear-leaf${k}`,
      v(clear, d.doorHeight, d.leafThickness),
      v(middle, door, -d.depth),
      { color: "#c8102e" },
    );
    builder.affordance({
      id: `rear${k}`,
      kind: "hinge",

      // Hinged at the +X partition and reaching toward -X, it swings back toward -Z.
      frame: AutoMovieArchetypeFrame.facing(
        v(middle + clear / 2, door, -d.depth),
        v(0, -1, 0),
        v(-1, 0, 0),
      ),
      extent: null,
      travel: AutoMovieArchetypeStartingGate.SWING,
      parts: [`rear-leaf${k}`],
    });
    builder.affordance({
      id: `stall${k}`,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(
        v(middle, 0, -d.depth / 2),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      width: clear,
      depth: d.depth,
    });
  }
  return builder.build(d.mass * stalls);
}

  /**
   * The affordance ids, each stall `k` from 0 on `-X`:
   *
   * - `door<n>`: the front leaves' hinges, `door<2k>` on the stall's `-X` side
   *   and `door<2k+1>` on its `+X` side; every leaf follows `door0`, so
   *   `door0`'s travel opens the whole front toward `+Z`.
   * - `rear<k>`: the stall's rear door, swinging back toward `-Z`.
   * - `stall<k>`: the stall's floor, facing up, its middle where a horse stands.
   */
  export type Affordance = `door${number}` | `rear${number}` | `stall${number}`;

  /**
   * The dimensions, metres unless stated:
   *
   * - `pitch`: the distance from one partition to the next, read.
   * - `depth`: a stall's length from the front doors to the rear door.
   * - `height`: the overhead frame's top.
   * - `doorHeight`: the doors' and the partitions' height; `doorFoot`: their foot
   *   above the ground.
   * - `partition`: a partition's and a post's thickness; `leafThickness`: a door
   *   leaf's.
   * - `mass`: the gate's mass per stall, kilograms.
   */
  export type Dimension =
    | "pitch"
    | "depth"
    | "height"
    | "doorHeight"
    | "doorFoot"
    | "partition"
    | "leafThickness"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    pitch: "m",
    depth: "m",
    height: "m",
    doorHeight: "m",
    doorFoot: "m",
    partition: "m",
    leafThickness: "m",
    mass: "kg",
  };

  /**
   * The stall pitch, metres: the 20-stall Derby gate's 65 feet over its 20
   * stalls (Daily Racing Form, "Churchill to debut new 20-stall starting gate
   * for 2020 Kentucky Derby": "The 20-stall gate is 65 feet wide",
   * https://www.drf.com/news/churchill-debut-new-20-stall-starting-gate-2020-kentucky-derby).
   */
  export const PITCH: number = (65 * 0.3048) / 20;

  /**
   * The most stalls a racing gate carries: "up to twenty stalls for racing
   * gates" (US RE40763, Horse race starting gate,
   * https://patents.google.com/patent/USRE40763).
   */
  export const MOST_STALLS: number = 20;

  /**
   * The stalls when none are given: a gate of 14, a common full field and an
   * estimate.
   */
  export const STALLS: number = 14;

  /**
   * A door's opening, degrees: a front leaf lies along its partition at 90,
   * which opens the stall's full clear width; the rear door opens as far.
   */
  export const SWING: number = 90;

  /**
   * The parameters: the stalls, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "pitch">, number>
  > {
    /**
     * The number of stalls, a whole number from 1 to `MOST_STALLS`; `STALLS`
     * when absent.
     */
    stalls?: number;

    /** The model's id, unique in a scene; `startingGate` when absent. */
    id?: string;
  }

  /** The band of each free dimension, every one an estimate (`ESTIMATE`). */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "pitch">, IAutoMovieArchetypeBand>
  > = {
    depth: AutoMovieArchetypeBand.metres(2.6, 3, AutoMovieArchetypeStartingGateData.ESTIMATE, true),
    height: AutoMovieArchetypeBand.metres(2.6, 3, AutoMovieArchetypeStartingGateData.ESTIMATE, true),
    doorHeight: AutoMovieArchetypeBand.metres(1.2, 1.5, AutoMovieArchetypeStartingGateData.ESTIMATE, true),
    doorFoot: AutoMovieArchetypeBand.metres(0.3, 0.45, AutoMovieArchetypeStartingGateData.ESTIMATE, true),
    partition: AutoMovieArchetypeBand.metres(0.08, 0.12, AutoMovieArchetypeStartingGateData.ESTIMATE, true),
    leafThickness: AutoMovieArchetypeBand.metres(0.03, 0.05, AutoMovieArchetypeStartingGateData.ESTIMATE, true),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      250,
      400,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
