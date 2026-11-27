import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanLimbFitFrame,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The frame a fit of a pose and a goal is solved in, or null when it stays in
 * the world.
 *
 * @param pose The pose before the fit.
 * @param goal The limb's goal.
 * @returns The frame, or null.
 */
export function HumanLimbFitFrame(
  pose: IAutoMoviePose,
  goal: IAutoMovieHumanLimbGoal,
): IAutoMovieMotionHumanLimbFitFrame.IFrame | null {
  if (
    pose.root === null ||
    goal.on !== undefined ||
    goal.clear !== undefined ||
    goal.clearExternal !== undefined ||
    goal.rests !== undefined
  )
    return null;
  const ahead: IAutoMovieVector3 = Quaternion.rotateVector(pose.root.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  const heading: number = (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI;
  return {
    x: pose.root.translation.x,
    y: pose.root.translation.y,
    z: pose.root.translation.z,
    into: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -heading),
  };
}

/**
 * The frame a limb fit is solved in (`solveHumanLimbFit`): the root's world
 * position and heading, so two people of one body doing the same thing in
 * different places, or one body facing another way, solve the same numbers.
 *
 * A pose and its goal are moved into the frame by taking away the root's world
 * position on all three axes and turning by minus its heading about +Y; the
 * limb solver reads only the geometry relative to the root, so a fit solved in
 * the frame is the fit solved in the world, moved. The fitted pose is handed
 * back with the caller's own root, since a limb fit changes the limb's joints
 * and not the root; its seed (the swivel and branch of
 * `fitSeededChainToTarget`) lives in the chain root's bone-local frame, which a
 * turn about +Y and a world translation leave as they are, so it is handed back
 * unchanged. A goal attached to a bone (`on`), or kept clear of or resting on
 * other bodies' colliders (`clear`, `rests`), names world things the frame
 * would have to carry, and is solved in the world; so is a pose without a
 * root.
 *
 * The limb solver has no absolute floor-height term: free-leg geometry,
 * own-body arm clearance and contact re-aim depend on relative positions, local
 * contact offsets and rotations. Every root, target, bend and rival point moves
 * together. A world-fixed ground goal remains different when only the root
 * moves vertically, because its relative target Y changes.
 */
export namespace HumanLimbFitFrame {
  /**
   * A world point in the frame.
   *
   * @param frame The frame.
   * @param point The point, world metres.
   * @returns The point in the frame.
   */
  export function point(
    frame: IAutoMovieMotionHumanLimbFitFrame.IFrame,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(frame.into, {
      x: point.x - frame.x,
      y: point.y - (frame.y ?? 0),
      z: point.z - frame.z,
    });
  }

  /**
   * A pose in the frame: its root moved and turned; its joints as they are.
   *
   * @param frame The frame.
   * @param pose The pose, with a root.
   * @returns The pose in the frame.
   */
  export function pose(
    frame: IAutoMovieMotionHumanLimbFitFrame.IFrame,
    pose: IAutoMoviePose,
  ): IAutoMoviePose {
    if (pose.root === null) return pose;
    return {
      ...pose,
      root: {
        ...pose.root,
        translation: point(frame, pose.root.translation),
        rotation: Quaternion.multiply(frame.into, pose.root.rotation),
      },
    };
  }

  /**
   * A goal in the frame: its point and bend moved and its rotation turned;
   * everything else as it is, its contact too, which lies in the end joint's
   * own rest frame (`HumanPosture.IGoal.contact`) and turns with the joint.
   *
   * @param frame The frame.
   * @param goal The goal, attached to no bone and naming no collider.
   * @returns The goal in the frame.
   */
  export function goal(
    frame: IAutoMovieMotionHumanLimbFitFrame.IFrame,
    goal: IAutoMovieHumanLimbGoal,
  ): IAutoMovieHumanLimbGoal {
    return {
      ...goal,
      point: point(frame, goal.point),
      bend: point(frame, goal.bend),
      ...(goal.rotation === undefined
        ? {}
        : { rotation: Quaternion.multiply(frame.into, goal.rotation) }),
    };
  }
}
