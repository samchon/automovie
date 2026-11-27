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
 * (`HumanMountPush.twist`): the knee then bends in the plane the foot's ankle
 * flexes in, the plane `HumanMountPush.tip` reads the ankle's bend in, so a
 * foot turned down by the ankle's excess is turned by the excess the fitted leg
 * shows. The ankle and the foot stay as they were.
 *
 * @param body The body, whose thigh and shank lengths are read.
 * @param hip The hip joint, world metres.
 * @param goal The leg's goal.
 * @returns The goal, its pole turned; unchanged for a degenerate leg or a foot
 *   already in the knee's plane.
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
