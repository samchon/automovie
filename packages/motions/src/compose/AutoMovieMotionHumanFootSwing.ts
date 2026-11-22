import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A stepping foot's placement through its swing: it travels and turns on a
 * minimum-jerk share of the swing's time (Flash and Hogan 1985) and rises by
 * `clearance sin(pi u)` of that time `u`. Near either end the rise changes
 * at first order in time while the travel changes at third order, so the
 * foot leaves its support before it moves along it and comes down after it
 * has stopped: no point of the sole slides on the support at lift-off or at
 * touch-down. A curve whose rise follows the travel's own share (a parabola
 * of it) keeps the sole within a few millimetres of the support while the
 * foot already slides, and the toes on the floor drag.
 *
 * @param from The placement the foot leaves.
 * @param to The placement it lands on.
 * @param clearance The ankle's greatest rise, metres.
 * @param time How far through the swing in time, 0 to 1.
 * @returns The placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two profiles, why each end has no slide, and the failure of a rise on the travel's share.
 * @evidence contracts/development/implementation.md#principled-implementation Minimum-jerk travel for a point-to-point move with settled ends (Flash and Hogan 1985); the half sine's rise is the lowest-order curve that leaves and lands at once with one peak. The half sine is a provisional shape, not a measured foot trajectory.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One share, one rise, one turn.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Time is held within 0 and 1, so the foot never passes either placement.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function AutoMovieMotionHumanFootSwing(
  from: IAutoMovieMotionHumanFoot.IPlacement,
  to: IAutoMovieMotionHumanFoot.IPlacement,
  clearance: number,
  time: number,
): IAutoMovieMotionHumanFoot.IPlacement {
  const u: number = Math.min(1, Math.max(0, time));
  const s: number = minimumJerk.share(u);
  const ankle: IAutoMovieVector3 = Vector3.lerp(from.ankle, to.ankle, s);
  return {
    ankle: { ...ankle, y: ankle.y + clearance * Math.sin(Math.PI * u) },
    rotation: Quaternion.slerp(from.rotation, to.rotation, s),
  };
}
