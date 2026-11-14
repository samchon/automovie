import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The bow of a standing body, the trunk's pitch about the hips the gesture
 * law applies to its `bow` and other laws to a lean from the hips, split
 * from the gesture law so each file holds one responsibility.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the transform is and who reads it.
 * @evidence contracts/development/design.md#principled-representation One pure posture transform over the posture type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by the gesture law, the arm wrestle and the throws.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body or case is special-cased.
 */
export namespace gestureBow {
  /**
   * A standing posture bowed by a trunk pitch: the whole body above the feet
   * tips about the hips, the hips move back by the balance shift, and the
   * planted legs are re-solved by their unchanged goals.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param pitch Forward pitch, degrees.
   * @param back How far the hips move back, metres.
   * @returns The bowed posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pivot, what moves, the units of the pitch and the shift, and that the legs keep their goals.
   * @evidence contracts/development/implementation.md#principled-implementation Adds the pitch to the posture's root pitch and places the root so the rest hips land at their standing point moved back by `back` in the posture's frame, a rotation about the hips; the leg goals stay on the feet and are solved when the posture is resolved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure posture transform shared by the plan and its balance solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No constants; the pitch and shift come from the caller.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time: one heading quaternion and one rotated offset.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new posture and retains nothing.
   */
  export function bowed(
    body: IHumanBody,
    posture: IHumanPosture,
    pitch: number,
    back: number,
  ): IHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
    const target: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: hips.x,
      y: hips.y,
      z: hips.z - back,
    });
    const tipped: IHumanPosture = { ...posture, pitch: posture.pitch + pitch };
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      resolveHumanPosture.heading(tipped),
      hips,
    );
    return { ...tipped, root: Vector3.subtract(target, offset) };
  }
}
