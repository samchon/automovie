import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanPosture } from "./IHumanPosture";

/**
 * A posture carried rigidly by a frame that moved: every world point of it
 * (the root and each limb goal that is not attached to a bone) goes where
 * the frame's motion from `origin` to `now` takes it, and the heading turns
 * with the frame. A seated rider on a car and a person on another's back
 * are carried this way.
 *
 * @param posture The posture when the frame was at `origin`.
 * @param origin The carrying frame then.
 * @param now The carrying frame at the instant asked.
 * @returns The carried posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is carried, what is left and the two frames.
 * @evidence contracts/development/implementation.md#principled-implementation The rigid transform `now * origin^-1` applied to world points and rotations; a goal attached to a bone already moves with the body.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One transform, one pass over the four limbs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The heading is read from the frames' turned forward axes, so a tilted frame turns the body only about the world's up.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function carryHumanPosture(
  posture: IHumanPosture,
  origin: carryHumanPosture.IFrame,
  now: carryHumanPosture.IFrame,
): IHumanPosture {
  const turn: IAutoMovieQuaternion = Quaternion.multiply(
    now.rotation,
    Quaternion.inverse(origin.rotation),
  );
  const carry = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(
      now.position,
      Quaternion.rotateVector(turn, Vector3.subtract(point, origin.position)),
    );
  const heading = (rotation: IAutoMovieQuaternion): number => {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
  };
  const limbs: IHumanPosture["limbs"] = {};
  for (const limb of ["leftLeg", "rightLeg", "leftArm", "rightArm"] as const) {
    const goal: IHumanPosture.IGoal | undefined = posture.limbs[limb];
    if (goal === undefined) continue;
    limbs[limb] =
      goal.on !== undefined
        ? goal
        : {
            ...goal,
            point: carry(goal.point),
            bend: carry(goal.bend),
            ...(goal.rotation === undefined
              ? {}
              : { rotation: Quaternion.multiply(turn, goal.rotation) }),
          };
  }
  return {
    ...posture,
    root: carry(posture.root),
    yaw: posture.yaw + heading(now.rotation) - heading(origin.rotation),
    limbs,
  };
}
/**
 * Companion types of {@link carryHumanPosture}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the member.
 * @evidence contracts/development/design.md#principled-representation A rigid world frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the function reads of a frame.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses interface vectors and quaternions.
 */
export namespace carryHumanPosture {
  /** A rigid world frame. */
  export interface IFrame {
    /** Origin, world metres. */
    position: IAutoMovieVector3;

    /** Rotation to the world. */
    rotation: IAutoMovieQuaternion;
  }
}
