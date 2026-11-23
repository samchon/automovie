import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanMountPush } from "./HumanMountPush";

/**
 * A leg goal whose knee pole is turned about the leg's line, the hip to the
 * ankle, until the foot's turn out of the knee's plane is nil
 * (`HumanMountPush.twist`): the knee then bends in the plane the foot's
 * ankle flexes in, the plane `HumanMountPush.tip` reads the ankle's bend
 * in, so a foot turned down by the ankle's excess is turned by the excess
 * the fitted leg shows. The ankle and the foot stay as they were.
 *
 * @param body The body, whose thigh and shank lengths are read.
 * @param hip The hip joint, world metres.
 * @param goal The leg's goal.
 * @returns The goal, its pole turned; unchanged for a degenerate leg or a foot already in the knee's plane.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is turned, what is kept and why the reading needs it.
 * @evidence contracts/development/implementation.md#principled-implementation An ankle with an immobile axial axis meets a foot rotation only at the swivel whose bend plane holds its flexion axis (Tolani, Goswami and Badler 2000, section 3.2.4); the turn of the pole that brings the twist to nil is the root of a function near linear in that turn, taken by one secant step from two readings.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two readings, one secant step.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The step is exact for a linear twist; the residual of the near-linear reading is not corrected further, and is stated here.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanMountPush.twist`, the one reading of the turn.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function HumanMountTrack(
  body: IAutoMovieMotionHumanBody,
  hip: IAutoMovieVector3,
  goal: IAutoMovieHumanLimbGoal,
): IAutoMovieHumanLimbGoal {
  const line: IAutoMovieVector3 = Vector3.subtract(goal.point, hip);
  if (Vector3.length(line) < 1e-9) return goal;
  const axis: IAutoMovieVector3 = Vector3.normalize(line);
  const turned = (degrees: number): IAutoMovieHumanLimbGoal => ({
    ...goal,
    bend: Vector3.add(
      hip,
      Quaternion.rotateVector(
        Quaternion.fromAxisAngle(axis, degrees),
        Vector3.subtract(goal.bend, hip),
      ),
    ),
  });
  const before: number | undefined = HumanMountPush.twist(
    body,
    hip,
    goal,
  )?.degrees;
  if (before === undefined || Math.abs(before) < 1e-6) return goal;
  const after: number | undefined = HumanMountPush.twist(
    body,
    hip,
    turned(before),
  )?.degrees;
  if (after === undefined || Math.abs(before - after) < 1e-9) return goal;
  return turned((before * before) / (before - after));
}
