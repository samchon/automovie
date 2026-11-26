import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import type { AutoMovieXpbdBody } from "../AutoMovieXpbdBody";

/**
 * Project both bodies' world inverse inertia tensors onto each joint axis,
 * giving relative-rotation inertia.
 */
export function physicalJointInertia(
  frame: IAutoMovieQuaternion,
  child: AutoMovieXpbdBody,
  parent?: AutoMovieXpbdBody,
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
  for (const body of parent ? [child, parent] : [child])
    for (const [index, axis] of (["x", "y", "z"] as const).entries()) {
      const v: IAutoMovieVector3 = directions[index]!;
      inverse[axis] += Vector3.dot(v, body.inverseInertia(v));
    }
  const result: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const axis of ["x", "y", "z"] as const) {
    if (inverse[axis] <= 0)
      throw new Error("Angular tracking needs a positive dynamic inertia");
    result[axis] = 1 / inverse[axis];
  }
  return result;
}
