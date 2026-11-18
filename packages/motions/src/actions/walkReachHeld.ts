import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The pelvis tilted with the trunk about the hips, the tilt a walk's ground
 * solve settles its lowering on (`walkReach.ground`'s `tilt`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation The pelvis's tilt apart from the walk's own settling.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One tilt, read by `StaggerFeet`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pivot is the body's own hips bone.
 */
export namespace walkReachHeld {
  /**
   * A pelvis tilted with the trunk about the hips, as
   * `AutoMovieMotionHumanLean.pivot` tilts a posture: the hips bone stays and
   * the hip joints turn about it.
   *
   * @param body The body.
   * @param root The upright root, world metres.
   * @param yaw The heading, degrees.
   * @param joints The upright hip joints under that root, world metres.
   * @param trunk The posture's added pitch and roll, degrees.
   * @returns The pelvis's world rotation and the tilted hip joints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the hips pivot, world-metre geometry and added trunk angles.
   * @evidence contracts/development/implementation.md#principled-implementation The rigid turn from the upright heading to the tilted one, rotation times the upright's inverse, applied to each hip joint about the hips bone at the root plus its rotated rest offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One turn and one pivot serve both hip joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the body's rest hips bone and the posture's heading convention without a changed angle or position.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: two heading quaternions, one inverse and two joint rotations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the posture's heading owner; each call evaluates its own root, joints and trunk.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and retains nothing.
   */
  export function tilt(
    body: IAutoMovieMotionHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    joints: Readonly<Record<"left" | "right", IAutoMovieVector3>>,
    trunk: { pitch: number; roll: number },
  ): {
    rotation: IAutoMovieQuaternion;
    hips: Record<"left" | "right", IAutoMovieVector3>;
  } {
    const upright: IAutoMovieQuaternion = resolveHumanPosture.heading({
      yaw,
      pitch: 0,
      roll: 0,
    });
    const rotation: IAutoMovieQuaternion = resolveHumanPosture.heading({
      yaw,
      pitch: trunk.pitch,
      roll: trunk.roll,
    });
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      rotation,
      Quaternion.inverse(upright),
    );
    const centre: IAutoMovieVector3 = Vector3.add(
      root,
      Quaternion.rotateVector(upright, body.rest.get("hips")!),
    );
    const at: (side: "left" | "right") => IAutoMovieVector3 = (
      side: "left" | "right",
    ): IAutoMovieVector3 =>
      Vector3.add(
        centre,
        Quaternion.rotateVector(turn, Vector3.subtract(joints[side], centre)),
      );
    return { rotation, hips: { left: at("left"), right: at("right") } };
  }
}
