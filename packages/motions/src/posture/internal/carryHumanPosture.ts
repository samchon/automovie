import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanCarryHumanPosture,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A posture carried rigidly by a frame that moved: every world point of it (the
 * root and each limb goal that is not attached to a bone) goes where the
 * frame's motion from `origin` to `now` takes it, and the heading turns with
 * the frame. A seated rider on a car and a person on another's back are carried
 * this way.
 * Parameter posture: The posture when the frame was at `origin`.
 * Parameter origin: The carrying frame then.
 * Parameter now: The carrying frame at the instant asked.
 * Returns: The carried posture.
 */
export function carryHumanPosture(
  posture: IAutoMovieMotionHumanPosture,
  origin: IAutoMovieMotionHumanCarryHumanPosture.IFrame,
  now: IAutoMovieMotionHumanCarryHumanPosture.IFrame,
): IAutoMovieMotionHumanPosture {
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
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const limb of ["leftLeg", "rightLeg", "leftArm", "rightArm"] as const) {
    const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[limb];
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
