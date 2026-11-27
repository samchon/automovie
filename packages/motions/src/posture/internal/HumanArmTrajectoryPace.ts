import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

/*
 * The timing readings of an arm trajectory's solve (`HumanArmTrajectory`): the
 * frame grid a span is read on where no course gives its own, a laid course's
 * arms as coordinates on a context's waypoints, and the factor a trajectory's
 * span must grow by to keep every speed-bounded probe within the law's own pace
 * (`M.IContext.speed`).
 */
export namespace HumanArmTrajectoryPace {
  /*
   * The frame grid's step, seconds, where no course gives its own grid.
   */
  export const STEP: number = 1 / 30;

  /*
   * Close a retimed span on the next admission-frame duration. The new phase
   * grid can land nearer the path's true peak than the old grid did. Give it
   * one frame of time to resample without changing the speed limit.
   * Parameter required: The span demanded by the falling step ratio, seconds.
   * Returns: The next strictly greater frame duration, seconds.
   */
  export function duration(required: number): number {
    return (Math.floor(required / STEP) + 1) * STEP;
  }

  /*
   * The factor a trajectory's span must grow by for every speed-bounded probe
   * to move within the law's own pace: the largest ratio, over each interval
   * and probe, of the probe's speed to the pace there.
   * Parameter c: The context the coordinates are read on.
   * Parameter x: Each arm's coordinates at each waypoint.
   * Parameter placed: The matching previous frame-grid evaluation, when already
   * available.
   * Returns: The factor, at least 1.
   */
  export function slower(
    c: M.IContext,
    x: readonly (readonly number[])[][],
    placed?: M.IEvaluation["placed"],
  ): number {
    let most: number = 1;
    x.forEach((arm: readonly (readonly number[])[], a: number): void => {
      const place = (k: number): IAutoMovieMotionHumanArmGeometry.IPlaced =>
        placed?.[a]?.[k] ??
        G.placed(c.setups[a]!, c.frames[a]![k]!, arm[k]!, false);
      if (c.n < 2) return;
      let now: IAutoMovieMotionHumanArmGeometry.IPlaced = place(0);
      for (let k: number = 0; k + 1 < c.n; ++k) {
        const next: IAutoMovieMotionHumanArmGeometry.IPlaced = place(k + 1);
        const dt: number = c.times[k + 1]! - c.times[k]!;
        const limit: number = c.speed((c.times[k]! + c.times[k + 1]!) / 2) * dt;

        // The arm's own travel, against its base (`HumanArmTrajectoryTravel`):
        // slowing the action slows nothing a carrier does.
        for (const p of T.SPEED) {
          const d: IAutoMovieVector3 = V.step(
            c.frames[a]![k]!,
            c.frames[a]![k + 1]!,
            now.probes[p]![0],
            next.probes[p]![0],
          );
          const travel: number = AutoMovieEngineVector3.length(d);
          if (travel > 0) most = Math.max(most, travel / limit);
        }
        now = next;
      }
    });
    return most;
  }

  /*
   * A course's arms at a context's waypoints as coordinates, its first and
   * returned last waypoint the context's rest and back.
   * Parameter c: The context.
   * Parameter course: Each arm's laid course.
   * Returns: Each arm's coordinates at each waypoint.
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

  /*
   * A span's instants a frame apart, its two ends among them: the frame grid
   * where no course gives its own.
   * Parameter start: The span's first instant, seconds.
   * Parameter end: Its last, seconds.
   * Returns: The instants, rising.
   */
  export function uniform(start: number, end: number): number[] {
    const grid: number[] = [start];
    for (let j: number = 1; start + j * STEP < end - 1e-9; ++j)
      grid.push(start + j * STEP);
    grid.push(end);
    return grid;
  }
}
