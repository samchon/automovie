import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../humanPostureHeading";

/**
 * A posture's root and world limb goals after its whole-body `rotation` : the
 * root's position goes round the rotation's point and its rotation becomes the
 * turn times the heading, and each world limb goal's point and bend go round
 * the same point and its rotation is composed after the turn. A goal attached
 * to a bone (`on`) is kept, since its bone moves with the turned body already.
 * A planted goal refuses the turn unless the rotation keeps it (`planted:
 * true`): then it stays in the world and its limb is re-solved onto it. Without
 * a rotation the root is the posture's own and the goals are returned
 * unchanged.
 *
 * The root's rotation is composed as a quaternion and never read back into
 * Euler angles, so a turn through the vertical keeps every digit, which the
 * heading's angles lose near a pitch of 90 degrees
 * (`humanPostureHeading.angles`).
 *
 * @param posture The posture.
 * @returns Its root's world position and rotation and its limb goals, turned.
 * @throws {Error} When the posture has a rotation and a planted world goal,
 *   naming the limb: a rigid turn of the body cannot keep a plant.
 */
export function turnHumanPosture(
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanTurnHumanPosture.ITurned {
  const heading: IAutoMovieQuaternion = humanPostureHeading(posture);
  const rotation: IAutoMovieHumanPostureRotation | undefined = posture.rotation;
  if (rotation === undefined)
    return { position: posture.root, rotation: heading, limbs: posture.limbs };
  const turn: IAutoMovieQuaternion = Quaternion.normalize(rotation.turn);
  const round = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(
      rotation.about,
      Quaternion.rotateVector(turn, Vector3.subtract(point, rotation.about)),
    );
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const [limb, goal] of Object.entries(posture.limbs) as [
    AutoMovieHumanLimb,
    IAutoMovieHumanLimbGoal,
  ][]) {
    if (goal.on !== undefined) {
      limbs[limb] = goal;
      continue;
    }
    if (goal.planted === true && rotation.planted === true) {
      limbs[limb] = goal;
      continue;
    }
    if (goal.planted === true)
      throw new Error(
        `The ${limb} goal is planted in the world and cannot turn with the whole body's rotation`,
      );
    limbs[limb] = {
      ...goal,
      point: round(goal.point),
      bend: round(goal.bend),
      ...(goal.rotation === undefined
        ? {}
        : { rotation: Quaternion.multiply(turn, goal.rotation) }),
    };
  }
  return {
    position: round(posture.root),
    rotation: Quaternion.normalize(Quaternion.multiply(turn, heading)),
    limbs,
  };
}
