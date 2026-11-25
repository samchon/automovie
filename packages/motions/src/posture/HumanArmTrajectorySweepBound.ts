import {
  AutoMovieMotionBound,
  Vector3,
  physicalShapeGjk,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanArmTrajectoryHalfStep } from "./HumanArmTrajectoryHalfStep";
import type { HumanArmTrajectoryLinks } from "./HumanArmTrajectoryLinks";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/** The frame times needed to bound a probe's chord travel. */
type ChordClock = Pick<M.IContext, "times">;

/**
 * The motion bounds the arm's sweeps (`HumanArmTrajectorySweep`) certify frame
 * steps by, prepared once per course: conservative advancement (Mirtich 1996,
 * "Impulse-based Dynamic Simulation of Rigid Body Systems", PhD thesis, UC
 * Berkeley, ch. 3) leaves a step unread while what the sweep reads there can
 * have moved less than the clearance a step already read showed, and these
 * bounds give that movement in closed form (`AutoMovieMotionBound`).
 */
export namespace HumanArmTrajectorySweepBound {
  /**
   * The bound on a probe's course over an interval, prepared once
   * (`AutoMovieMotionBound.prepare`): its chord lengths per frame step over the
   * steps' seconds from the interval's first waypoint, the chords being the
   * course `HumanArmTrajectorySweep.of` reads. None where the course has no
   * step.
   *
   * @param c The context, whose waypoint seconds time the steps.
   * @param k The interval's first waypoint.
   * @param frames The course's waypoints, from `k`, in course order.
   * @param course The probe's places at those waypoints, carried into the
   *   shape's frame at `k`, world metres.
   * @returns The bound in metres over seconds from `k`, or none.
   */
  export function chords(
    c: ChordClock,
    k: number,
    frames: readonly number[],
    course: readonly IAutoMovieVector3[],
  ): AutoMovieMotionBound.IPrepared | undefined {
    const along: number[] = frames.map((g: number): number =>
      Math.abs(c.times[g]! - c.times[k]!),
    );
    const speeds: number[] = [];
    for (let i: number = 0; i + 1 < along.length; ++i)
      speeds.push(
        Vector3.distance(course[i]!, course[i + 1]!) /
          (along[i + 1]! - along[i]!),
      );
    return speeds.length === 0
      ? undefined
      : AutoMovieMotionBound.prepare(along, speeds);
  }

  /**
   * The bound on a part's casts over an interval, prepared once
   * (`AutoMovieMotionBound.prepare`): per frame step, the farthest any point of
   * its solids moves between the step's two frames, carried into the shape's
   * frame at the interval's first waypoint as the casts carry them
   * (`HumanArmTrajectoryLinks.cast`), over the steps' seconds from that
   * waypoint. None where the interval has no step.
   *
   * @param c The context, whose waypoint seconds time the steps.
   * @param a The arm.
   * @param k The interval's first waypoint.
   * @param part The part, by its index in the body's tangle model.
   * @param steps The arm's solids at each frame of the interval, from `k`, in
   *   course order (`HumanArmTrajectoryLinks.IStep`).
   * @param shape The shape, by its index in the frame at `k`.
   * @returns The bound in metres over seconds from `k`, or none.
   */
  export function solids(
    c: M.IContext,
    a: number,
    k: number,
    part: number,
    steps: readonly HumanArmTrajectoryLinks.IStep[],
    shape: number,
  ): AutoMovieMotionBound.IPrepared | undefined {
    // The part's solids' points at a frame, carried, in solid and point order.
    const carried = (
      step: HumanArmTrajectoryLinks.IStep,
    ): IAutoMovieVector3[] =>
      (step.solids.get(part) ?? []).flatMap(
        (solid: physicalShapeGjk.ISolid): IAutoMovieVector3[] =>
          solid.points.map(
            (p: IAutoMovieVector3): IAutoMovieVector3 =>
              HumanArmTrajectoryHalfStep.carry(c, a, k, step.at, shape, p)
                .point,
          ),
      );

    const along: number[] = steps.map(
      (step: HumanArmTrajectoryLinks.IStep): number =>
        Math.abs(c.times[step.at]! - c.times[k]!),
    );
    let before: IAutoMovieVector3[] = carried(steps[0]!);
    const speeds: number[] = [];
    for (let i: number = 0; i + 1 < steps.length; ++i) {
      const h: number = along[i + 1]! - along[i]!;
      const after: IAutoMovieVector3[] = carried(steps[i + 1]!);
      let most: number = 0;
      for (let m: number = 0; m < after.length; ++m)
        most = Math.max(most, Vector3.distance(before[m]!, after[m]!));
      speeds.push(most / h);
      before = after;
    }
    return speeds.length === 0
      ? undefined
      : AutoMovieMotionBound.prepare(along, speeds);
  }
}
