import type {
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * The interval an admitted shape covers along a world direction: the lowest and
 * highest projections of its points onto a unit axis, metres from the world
 * origin. The shape is placed by its parent pose composed with its own
 * transform.
 *
 * @param pose The shape's parent pose, world metres.
 * @param shape The shape.
 * @param axis A unit direction, world frame.
 * @returns The low and high projections, metres along the axis.
 */
export function physicalShapeSpan(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
  axis: IAutoMovieVector3,
): readonly [number, number] {
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  const centre: number = Vector3.dot(
    Vector3.add(
      pose.position,
      Quaternion.rotateVector(pose.rotation, shape.transform.position),
    ),
    axis,
  );
  // The axis in the shape's own frame, so local points project directly.
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(rotation),
    axis,
  );
  if (shape.kind === "sphere")
    return [centre - shape.radius, centre + shape.radius];
  if (shape.kind === "capsule") {
    const half: number = shape.radius + shape.halfLength * Math.abs(local.y);
    return [centre - half, centre + half];
  }
  if (shape.kind === "box") {
    const half: number =
      shape.halfExtents.x * Math.abs(local.x) +
      shape.halfExtents.y * Math.abs(local.y) +
      shape.halfExtents.z * Math.abs(local.z);
    return [centre - half, centre + half];
  }
  if (shape.kind === "hull") {
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (const point of shape.points) {
      const along: number = Vector3.dot(point, local);
      lo = Math.min(lo, along);
      hi = Math.max(hi, along);
    }
    return [centre + lo, centre + hi];
  }
  shape satisfies never;
  throw new Error("Unknown physical shape kind");
}
