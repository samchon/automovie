import { ANKLE_DORSIFLEXION, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { shankTilt } from "./shankTilt";

/** How far short of the unloaded limit the closed form keeps a weightless ankle, degrees: the ideal two-link leg's lean, read without the pelvis's own turn, differs from the fitted one by up to a few degrees. */
const MARGIN: number = 3;

/**
 * A leg goal whose foot bears nothing, turned toes down as far as its
 * ankle would otherwise dorsiflex past what a weightless ankle reaches
 * (`ANKLE_DORSIFLEXION.unloaded`): the shank's forward lean (`shankTilt`)
 * plus the foot's own pitch is the ankle's dorsiflexion.
 *
 * @param body The body.
 * @param hip The leg's hip joint, world metres.
 * @param goal The leg goal, its foot turned by `rotation`.
 * @param facing The unit horizontal facing.
 * @param weight The share of the turn applied, 0 to 1: a caller easing the foot in and out of its plants passes less than 1 near them.
 * @returns The goal, its foot turned down when it must be; unchanged otherwise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the limit, the reading and when the goal is unchanged.
 * @evidence contracts/development/implementation.md#principled-implementation The ankle's dorsiflexion is the shank's lean plus the foot's pitch; the foot turns about the lateral axis by the excess.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the lean and pitch, turn by the excess.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The margin is a named value for the closed form's error, not a looser limit.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call is independent arithmetic.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function unloadedFoot(
  body: IAutoMovieMotionHumanBody,
  hip: IAutoMovieVector3,
  goal: IAutoMovieHumanLimbGoal,
  facing: IAutoMovieVector3,
  weight: number = 1,
): IAutoMovieHumanLimbGoal {
  if (goal.rotation === undefined) return goal;
  const excess: number =
    shankTilt(body, hip, goal.point, facing) +
    HumanFoot.pitch(goal.rotation) -
    (ANKLE_DORSIFLEXION.unloaded - MARGIN);
  if (excess <= 0) return goal;
  return {
    ...goal,
    rotation: Quaternion.multiply(
      Quaternion.fromAxisAngle(
        Vector3.cross({ x: 0, y: 1, z: 0 }, facing),
        excess * weight,
      ),
      goal.rotation,
    ),
  };
}
