import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * The interval an admitted shape covers along a world direction: the lowest
 * and highest projections of its points onto a unit axis, metres from the
 * world origin. The shape is placed by its parent pose composed with its own
 * transform.
 *
 * @param pose The shape's parent pose, world metres.
 * @param shape The shape.
 * @param axis A unit direction, world frame.
 * @returns The low and high projections, metres along the axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the interval, its frame and unit and how the shape is placed.
 * @evidence contracts/development/implementation.md#principled-implementation The support function of each convex kind along the axis and its opposite: a sphere's radius, a capsule's projected half axis plus its radius, a box's projected half extents summed, a hull's extreme projected point (Ericson, Real-Time Collision Detection, 2005, ch. 9.5.3).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per shape kind with an exhaustive check.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No margin or sampling; every kind is projected exactly and an unknown kind throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant for a sphere, capsule and box, linear in a hull's points.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function physicalShapeSpan(
  pose: P.ITransform,
  shape: P.IShape,
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
