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
