import type { IAutoMovieMotionHumanArmGeometry } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectorySweep as Sweep } from "./HumanArmTrajectorySweep";

/** A settled pose at one of the neighbouring frame instants. */
interface IAnchor {
  /** Its index on the full admission grid. */
  frame: number;
  /** Its joint coordinates in course arm order. */
  pose: readonly (readonly number[])[];
}

/**
 * Read the actual adjacent frame sweeps from a candidate hold to its settled
 * neighbours. The fixed placements are prepared before testing candidates. An
 * interval with an intervening frame belongs to the trajectory solve.
 *
 * @param c The original frame-grid context and all authored allowances.
 * @param k The new hold's frame index.
 * @param anchors The already solved neighbouring frame poses.
 * @returns The clearance check, or undefined without a settled neighbour.
 */
export function HumanArmSeedTransition(
  c: M.IContext,
  k: number,
  anchors: readonly IAnchor[],
):
  | ((pose: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[]) => boolean)
  | undefined {
  if (anchors.length === 0) return undefined;
  const fixed = anchors.map(({ frame, pose }) => ({
    frame,
    placed: pose.map((q, a) => G.placed(c.setups[a]!, c.frames[a]![frame]!, q)),
  }));
  return (pose): boolean =>
    fixed.every(({ frame, placed }) => {
      const from: number = Math.min(frame, k);
      const to: number = Math.max(frame, k);
      return pose.every((own, a): boolean => {
        const first = from === k ? own : placed[a]!;
        const last = to === k ? own : placed[a]!;
        const near = { at: to, placed: last, path: [{ at: to, placed: last }] };
        const course: IAutoMovieMotionHumanArmGeometry.IPlaced[] = [];
        course[from] = first;
        course[to] = last;
        return [
          ...Sweep(c, a, from, first, near),
          ...Sweep.links(c, a, from, course, near),
        ].every((sweep) => 1000 * (sweep.lower - sweep.clear) <= M.TOLERANCE);
      });
    });
}
