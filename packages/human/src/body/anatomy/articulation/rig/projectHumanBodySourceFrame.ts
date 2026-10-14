import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";

/**
 * Project a source-local site/orientation through the one actual source frame; shared by humanoid and toe-ray consumers.
 *
 * Inputs must be admitted finite rigid frames in common body metres, with local registration in the carrying source bone's frame. The returned position is frame.position plus frame.rotation applied to origin; orientation is normalized frame.rotation times rotation. Inputs are unchanged and no independent registration is inferred.
 *
 * @evidence contracts/common.md#principled-implementation Rigid frame composition rotates the local origin then translates it, and normalizes the parent-times-local quaternion; admitted source frames supply finite metre positions and unit rotations.
 * @evidence contracts/common.md#clear-and-simple-design One shared frame-projection helper serves public humanoid and toe-ray outputs so both use the same composition order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Projection uses actual source-local registration and does not fit an independently authored output rig to displayed geometry.
 * @evidence contracts/common.md#meaningful-documentation The description identifies shared source projection; expanded prose specifies the common metre frame, multiplication order and input-admission premise.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of three-vector and quaternion operations gives constant time and constant-sized output allocation independent of rig size.
 * @evidence contracts/performance.md#reuse-equivalent-work Humanoid and toe consumers share this implementation, while each call recomputes from its actual source frame and local registration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned position and rotation are fresh numerical values; the helper owns no persistent map, external handle or running operation.
 */
export function projectHumanBodySourceFrame(
  frame: IAutoMovieHumanBodyBoneWorldRest,
  origin: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
): IAutoMovieHumanBodyBoneWorldRest {
  return {
    position: Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, origin),
    ),
    rotation: Quaternion.normalize(
      Quaternion.multiply(frame.rotation, rotation),
    ),
  };
}
