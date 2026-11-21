import { Vector3, wrapDegrees } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Placing a whole-body posture so its displayed hips fall on a wanted world
 * point: the hips' offset from the root is read once by resolving the
 * posture at the origin, and the root is the wanted point less that offset.
 * Falls use it to carry a lying or tumbling body along a computed hips path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method and its use.
 * @evidence contracts/development/design.md#principled-representation The hips' offset from the root in world metres for a posture's own orientation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The offset reader and the placer the falls call.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The offset is the displayed body's own, not a constant.
 */
export namespace stuntFallPose {
  /**
   * The displayed hips' offset from the root.
   *
   * @param body The canonical motion body.
   * @param posture The posture, its root anywhere.
   * @returns Hips minus root, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's frame.
   * @evidence contracts/development/implementation.md#principled-implementation One resolve at the origin; the offset is translation-invariant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolve and one subtraction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the resolved hips bone.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The caller keeps the offset.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function offset(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 {
    const placed: IAutoMovieMotionHumanPosture = {
      ...posture,
      root: { x: 0, y: 0, z: 0 },
    };
    return poseBones(body, resolveHumanPosture.seeded(body, placed).pose).get(
      "hips",
    )!.worldPosition;
  }

  /**
   * Place a posture with its hips at a point.
   *
   * @param posture The posture.
   * @param hips The wanted hips, world metres.
   * @param offset The posture's hips offset from its root.
   * @returns The posture moved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and result.
   * @evidence contracts/development/implementation.md#principled-implementation Root equals the wanted hips less the offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One subtraction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Moves only the root.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(
    posture: IAutoMovieMotionHumanPosture,
    hips: IAutoMovieVector3,
    offset: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    return { ...posture, root: Vector3.subtract(hips, offset) };
  }

  /**
   * Blend one posture toward another: joints, root, yaw by the shortest arc, pitch and roll; the limbs and the rest are the target's.
   *
   * @param from The posture at weight 0.
   * @param to The posture at weight 1.
   * @param w The weight.
   * @returns The blend.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is blended and what is taken.
   * @evidence contracts/development/implementation.md#principled-implementation Linear in each joint angle and the root, the yaw wrapped.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the target's joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint absent from the source blends from zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the joints.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function blend(
    from: IAutoMovieMotionHumanPosture,
    to: IAutoMovieMotionHumanPosture,
    w: number,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...to.joints };
    for (const bone of Object.keys(
      to.joints,
    ) as (keyof IAutoMovieMotionHumanPosture["joints"])[]) {
      const a: readonly [number, number, number] = from.joints[bone] ?? [
        0, 0, 0,
      ];
      const b: readonly [number, number, number] = to.joints[bone]!;
      joints[bone] = [
        a[0] + (b[0] - a[0]) * w,
        a[1] + (b[1] - a[1]) * w,
        a[2] + (b[2] - a[2]) * w,
      ];
    }
    return {
      ...to,
      root: Vector3.lerp(from.root, to.root, w),
      yaw: from.yaw + wrapDegrees(to.yaw - from.yaw) * w,
      pitch: from.pitch + (to.pitch - from.pitch) * w,
      roll: from.roll + (to.roll - from.roll) * w,
      joints,
    };
  }
}
