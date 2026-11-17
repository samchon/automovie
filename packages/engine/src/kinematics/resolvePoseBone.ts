import type {
  IAutoMovieBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";

/**
 * Compose one bone through the same parent-first FK used by resolvePose.
 * Rotations must be unit quaternions; rest scale is ignored. All returned
 * transforms are newly owned, including when an input is an identity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States parent-frame inputs, unit-rotation and no-scale premises and fresh result ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Local rotation is rest times articulation, world rotation is parent times local, and world position is parent position plus the parent-rotated rest translation, with the existing multiplication grouping.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the single-bone composition shared by ordinary FK and its raw operation adapter; hierarchy traversal remains in resolvePose and immutable prepared-rig dependency work has its separate owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No articulation, offset, scale convention or quaternion normalization is substituted; the caller supplies the same admitted joint rotation and parent frame as ordinary FK.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two quaternion products, one vector rotation and one vector addition are constant work for one bone.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One pure raw composition retains every actual input read; immutable prepared-rig clients use their own genuinely owned dependency rows rather than caching mutable transform records here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh bone record and three fresh transform records; it retains no inputs, history or handle.
 */
export function resolvePoseBone(
  bone: IAutoMovieBone,
  parentRotation: IAutoMovieQuaternion,
  parentPosition: IAutoMovieVector3,
  articulation: IAutoMovieQuaternion,
): IAutoMovieResolvedBone {
  const localRotation: IAutoMovieQuaternion = Quaternion.multiply(
    bone.rest.rotation,
    articulation,
  );
  const worldRotation: IAutoMovieQuaternion = Quaternion.multiply(
    parentRotation,
    localRotation,
  );
  const worldPosition: IAutoMovieVector3 = Vector3.add(
    parentPosition,
    Quaternion.rotateVector(parentRotation, bone.rest.translation),
  );
  return { bone: bone.bone, localRotation, worldPosition, worldRotation };
}
