import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { RigidBody, SdpMatrix3 } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";

/**
 * Project both native world inverse tensors onto each joint axis, giving relative-rotation inertia.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Project both native world inverse tensors onto each joint axis, giving relative-rotation inertia) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Project both native world inverse tensors onto each joint axis, giving relative-rotation inertia) directly over its typed inputs (`frame`, `child`, `parent`) as nested iteration of depth 2 (map over [ { x: 1, y: 0, z: 0 }, { x: 0, ; for-of over parent ? [child, parent] : [child]; for-of over (["x", "y", "z"] as const).entries()), delegating to `Quaternion.rotateVector`, `body.effectiveWorldInvInertia`, `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 36 lines and 6 top-level statements that reuses `Quaternion.rotateVector`, `body.effectiveWorldInvInertia`, `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `frame`, `child`, `parent`; the dominant cost is nested iteration of depth 2 (map over [ { x: 1, y: 0, z: 0 }, { x: 0, ; for-of over parent ? [child, parent] : [child]; for-of over (["x", "y", "z"] as const).entries()), performed once per call with 11 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 11 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalJointInertia(
  frame: IAutoMovieQuaternion,
  child: RigidBody,
  parent?: RigidBody,
): IAutoMovieVector3 {
  const inverse: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const directions: IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ].map(
    (axis: { x: number; y: number; z: number }): IAutoMovieVector3 =>
      Quaternion.rotateVector(frame, axis),
  );
  // Rapier's matrix views share a scratch buffer. Project every component
  // before another native getter can replace the previous body's tensor.
  for (const body of parent ? [child, parent] : [child]) {
    const matrix: SdpMatrix3 = body.effectiveWorldInvInertia();
    for (const [index, axis] of (["x", "y", "z"] as const).entries()) {
      const v: IAutoMovieVector3 = directions[index]!;
      inverse[axis] +=
        v.x * v.x * matrix.m11 +
        v.y * v.y * matrix.m22 +
        v.z * v.z * matrix.m33 +
        2 *
          (v.x * v.y * matrix.m12 +
            v.x * v.z * matrix.m13 +
            v.y * v.z * matrix.m23);
    }
  }
  const result: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const axis of ["x", "y", "z"] as const) {
    if (!(inverse[axis] > 0) || !Number.isFinite(inverse[axis]))
      throw new Error(
        "Angular tracking needs a finite positive dynamic inertia",
      );
    result[axis] = 1 / inverse[axis];
  }
  return result;
}
