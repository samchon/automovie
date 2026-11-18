import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

/**
 * The timing readings of an arm trajectory's solve (`HumanArmTrajectory`):
 * the frame grid a span is read on where no course gives its own, a laid
 * course's arms as coordinates on a context's waypoints, and the factor a
 * trajectory's span must grow by to keep every speed-bounded probe within
 * the law's own pace (`M.IContext.speed`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three readings, their units and who reads them.
 * @evidence contracts/development/design.md#principled-representation Seconds for instants, joint coordinates per arm and waypoint, and a dimensionless slowing factor.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three functions and the grid step, read by the trajectory's solve alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The speed bound is the context's, the law's own pace (`M.IContext.speed`), and the probes the terms' (`T.SPEED`); nothing is restated.
 */
export namespace HumanArmTrajectoryPace {
  /** The frame grid's step, seconds, where no course gives its own grid. */
  export const STEP: number = 1 / 30;

  /**
   * The factor a trajectory's span must grow by for every speed-bounded
   * probe to move within the law's own pace: the largest ratio, over each
   * interval and probe, of the probe's speed to the pace there.
   *
   * @param c The context the coordinates are read on.
   * @param x Each arm's coordinates at each waypoint.
   * @returns The factor, at least 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the ratio, its floor and the inputs.
   * @evidence contracts/development/implementation.md#principled-implementation A probe's step over an interval divided by the bound times the interval is its speed's ratio to the bound; stretching the span by the greatest ratio brings every probe within it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over arms, intervals and speed probes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The probe's travel is read against its base (`HumanArmTrajectoryTravel`), so a carrier's own motion is not slowed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two placements per interval and arm and one step per speed probe.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function slower(c: M.IContext, x: readonly (readonly number[])[][]): number {
    let most: number = 1;
    x.forEach((arm: readonly (readonly number[])[], a: number): void => {
      for (let k: number = 0; k + 1 < c.n; ++k) {
        const now: IAutoMovieMotionHumanArmGeometry.IPlaced = G.placed(
          c.setups[a]!,
          c.frames[a]![k]!,
          arm[k]!,
        );
        const next: IAutoMovieMotionHumanArmGeometry.IPlaced = G.placed(
          c.setups[a]!,
          c.frames[a]![k + 1]!,
          arm[k + 1]!,
        );
        const dt: number = c.times[k + 1]! - c.times[k]!;

        // The arm's own travel, against its base (`HumanArmTrajectoryTravel`):
        // slowing the action slows nothing a carrier does.
        for (const p of T.SPEED) {
          const d: IAutoMovieVector3 = V.step(
            c.frames[a]![k]!,
            c.frames[a]![k + 1]!,
            now.probes[p]![0],
            next.probes[p]![0],
          );
          most = Math.max(
            most,
            Vector3.length(d) /
              (c.speed((c.times[k]! + c.times[k + 1]!) / 2) * dt),
          );
        }
      }
    });
    return most;
  }

  /**
   * A course's arms at a context's waypoints as coordinates, its first and
   * returned last waypoint the context's rest and back.
   *
   * @param c The context.
   * @param course Each arm's laid course.
   * @returns Each arm's coordinates at each waypoint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the ends' rule and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each interior waypoint encodes the course's arm at its instant, inside the coordinates' ranges (`M.ranged`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over arms and instants.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ends are the context's own, so the course never moves the rest or the back.
   * @evidence contracts/development/implementation.md#efficient-algorithms One course read and encoding per arm and waypoint.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh coordinates and retains nothing.
   */
  export function coursed(
    c: M.IContext,
    course: readonly IAutoMovieMotionHumanArmTrajectory.Trajectory[],
  ): number[][][] {
    return course.map(
      (
        reader: IAutoMovieMotionHumanArmTrajectory.Trajectory,
        a: number,
      ): number[][] =>
        c.times.map((t: number, k: number): number[] =>
          k === 0
            ? [...c.rest[a]!]
            : k === c.n - 1 && !c.open
              ? [...c.back[a]!]
              : M.ranged(c, a, G.encode(c.setups[a]!, reader(t))),
        ),
    );
  }

  /**
   * A span's instants a frame apart, its two ends among them: the frame grid
   * where no course gives its own.
   *
   * @param start The span's first instant, seconds.
   * @param end Its last, seconds.
   * @returns The instants, rising.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the grid, its ends and units.
   * @evidence contracts/development/implementation.md#principled-implementation Steps of `STEP` from the start, the last interior one more than a nanosecond short of the end so no interval is a rounding sliver.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both ends are kept exactly.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the span's frames.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh array and retains nothing.
   */
  export function uniform(start: number, end: number): number[] {
    const grid: number[] = [start];
    for (let j: number = 1; start + j * STEP < end - 1e-9; ++j)
      grid.push(start + j * STEP);
    grid.push(end);
    return grid;
  }
}
