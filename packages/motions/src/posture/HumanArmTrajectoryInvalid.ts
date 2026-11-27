import type { IAutoMovieMotionHumanArmGeometry } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryLimits } from "./HumanArmTrajectoryLimits";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { nameArmTrajectoryPair } from "./internal/nameArmTrajectoryPair";

/** The record of `IOfWorst`'s site. */
type IOfWorst = { value: number; what: string };

/** The record of `IOfResult`'s site. */
type IOfResult = { value: number; what: string };

/**
 * How far the arms' configuration at a waypoint passes the tangle audit's
 * clearance (with the skin `evaluate` refuses past) or a joint's range: the
 * configuration is valid where this is within `TOLERANCE`. One reading serves
 * the path planner's validity and the trajectory's refusal.
 *
 * @param c The context.
 * @param k The waypoint whose base and allowances it is read against.
 * @param q Each arm's coordinates.
 * @param forwardCertified Whether a conservative interval bound already proves
 *   the arm's forward surface probes clear; only that reading is then spared.
 *   Reverse corners, crossings and joint ranges are always read at this
 *   waypoint.
 * @param tasks Whether the hold's task points (its site's limits and skin
 *   distance) are read: true for the hold itself; false for a path planner's
 *   approach state read at the hold's waypoint, which keeps its contact
 *   allowances but not the task points that bind only the hold.
 * @returns The largest excess, millimetres or coordinate units, and what it is.
 */
export function HumanArmTrajectoryInvalid(
  c: M.IContext,
  k: number,
  q: readonly (readonly number[])[],
  forwardCertified: boolean = false,
  tasks: boolean = true,
): IOfResult {
  const placed: IAutoMovieMotionHumanArmGeometry.IPlaced[] = q.map(
    (
      v: readonly number[],
      a: number,
    ): IAutoMovieMotionHumanArmGeometry.IPlaced =>
      G.placed(c.setups[a]!, c.frames[a]![k]!, v),
  );
  let worst: IOfWorst = { value: -Infinity, what: "" };
  const note = (value: number, what: () => string): void => {
    if (value > worst.value) worst = { value, what: what() };
  };
  q.forEach((v: readonly number[], a: number): void => {
    const site: M.ISite | undefined = c.sites[a]![k];
    if (
      tasks &&
      site !== undefined &&
      (site.limits !== undefined || site.skinDistance !== undefined)
    ) {
      const at: P.ILocated = P.located(
        c,
        (arm: number): IAutoMovieMotionHumanArmGeometry.IPlaced => placed[arm]!,
        a,
        k,
        site,
      );
      for (const limit of HumanArmTrajectoryLimits(
        site,
        at,
        placed[a]!,
        c.frames[a]![k]!,
      ))
        note(
          limit.distance - limit.allowance,
          () =>
            `a task point lies ${limit.distance.toFixed(1)} mm from its goal`,
        );
    }
    if (!forwardCertified)
      // Only a pair its bounds cannot show clear is read exactly: a
      // validity reads past the bound alone (`HumanArmTrajectoryPairs.CUT`).
      for (const pair of P.deepest(c, a, k, placed[a]!, 0).values())
        note(
          pair.short - T.SKIN,
          () =>
            `${nameArmTrajectoryPair(c, a, k, pair.probe, pair.shape)} ${pair.short.toFixed(1)} mm deep`,
        );
    for (const pair of P.embedded(c, a, k, placed[a]!, 0).values())
      note(
        pair.short - T.SKIN,
        () =>
          `the body's ${pair.bone} ${pair.short.toFixed(1)} mm inside the arm's ${pair.shape.bone}`,
      );
    c.free[a]!.forEach((d: number): void => {
      const b: [number, number] | null | undefined = c.bounds[a]![d];
      if (b !== null && b !== undefined)
        note(
          Math.max(b[0] - v[d]!, v[d]! - b[1]),
          () => `coordinate ${d} out of its range`,
        );
    });
    note(
      Math.hypot(v[0]!, v[1]!) - HumanArmTrajectoryInvalid.swing(c, a),
      () => "the swing out of its chart",
    );
  });
  if (q.length === 2)
    for (const pair of P.crossing(c, k, placed[0]!, placed[1]!, 0).values())
      note(
        pair.short - T.SKIN,
        () =>
          `probe ${pair.probe} of the ${pair.a === 0 ? "first" : "second"} arm ${pair.short.toFixed(1)} mm inside the other's ${pair.bone}`,
      );
  return worst;
}

/**
 * Configuration validity for the arm path and its refinement: the forward
 * surface probes, reverse body corners, two arms' crossings, hard task points
 * and joint ranges. A forward interval certificate spares only its own directed
 * probe reading; every other constraint is still checked at the actual inner
 * waypoint.
 */
export namespace HumanArmTrajectoryInvalid {
  /**
   * The radius of an arm's chart disc in coordinate units: the chart's unit
   * disc, widened to the rest and the back arm's own swing.
   *
   * @param c The context.
   * @param a The arm.
   * @returns The radius.
   */
  export function swing(
    c: Pick<M.IContext, "rest" | "back">,
    a: number,
  ): number {
    return Math.max(
      G.SCALE,
      Math.hypot(c.rest[a]![0]!, c.rest[a]![1]!),
      Math.hypot(c.back[a]![0]!, c.back[a]![1]!),
    );
  }
}
