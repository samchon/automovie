import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { RigidBody, SdpMatrix3 } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";

/** Project both native world inverse tensors onto each joint axis, giving relative-rotation inertia. */
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
