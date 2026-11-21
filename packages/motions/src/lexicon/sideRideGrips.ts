import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The side of each grip's axis the fingers close over, chosen once where a ride's hold begins (`HumanRideHands`): the sign of the axis crossed with the grip's outward normal against the rider's forward, so the fingers wrap the grip on the side the body faces and keep that side afterwards. A sign re-taken at every second could flip the hand on an oar.
 *
 * @param grips Each holding hand's grip where the hold begins.
 * @param seated The seated posture the hold begins from.
 * @returns Each holding hand's side, for the grips that have an axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, its frame and why it is taken once.
 * @evidence contracts/development/implementation.md#principled-implementation One cross and one dot product per grip against the heading's forward.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Kept apart from the ride's hands so that owner stays within its size.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A grip without an axis takes no side.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per hand.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Taken once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function sideRideGrips(
  grips: Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanMountRider.IHoldGrip>
  >,
  seated: IAutoMovieMotionHumanPosture,
): Partial<
  Record<
    AutoMovieHumanSide,
    NonNullable<IAutoMovieMotionHumanMountRider.IHoldGrip["across"]>
  >
> {
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    resolveHumanPosture.heading(seated),
    { x: 0, y: 0, z: 1 },
  );
  const sides: Partial<
    Record<
      AutoMovieHumanSide,
      NonNullable<IAutoMovieMotionHumanMountRider.IHoldGrip["across"]>
    >
  > = {};
  for (const side of ["left", "right"] as const) {
    const grip: IAutoMovieMotionHumanMountRider.IHoldGrip | undefined =
      grips[side];
    if (grip?.axis === undefined) continue;
    sides[side] =
      Vector3.dot(Vector3.cross(grip.axis, grip.normal), forward) < 0 ? -1 : 1;
  }
  return sides;
}
