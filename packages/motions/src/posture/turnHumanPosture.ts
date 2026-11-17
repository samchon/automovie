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

import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * A posture's root and world limb goals after its whole-body `rotation`
 * (#3423): the root's position goes round the rotation's point and its
 * rotation becomes the turn times the heading, and each world limb goal's
 * point and bend go round the same point and its rotation is composed after
 * the turn. A goal attached to a bone (`on`) is kept, since its bone moves
 * with the turned body already. Without a rotation the root is the
 * posture's own and the goals are returned unchanged.
 *
 * The root's rotation is composed as a quaternion and never read back into
 * Euler angles, so a turn through the vertical keeps every digit, which the
 * heading's angles lose near a pitch of 90 degrees
 * (`resolveHumanPosture.angles`).
 *
 * @param posture The posture.
 * @returns Its root's world position and rotation and its limb goals, turned.
 * @throws {Error} When the posture has a rotation and a planted world goal, naming the limb: a rigid turn of the body cannot keep a plant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what goes round, what is kept, why the rotation stays a quaternion and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation One rigid motion `p -> a + T (p - a)` applied to every world place of the posture and `R -> T R` to every world rotation, so the resolved body is the unturned body turned rigidly.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One root and one pass over the four limbs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A planted world goal is refused, never silently turned off its plant.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: one heading and at most four goals.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the posture.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function turnHumanPosture(
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanTurnHumanPosture.ITurned {
  const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(posture);
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
