import type {
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * A convex collider's support point: its world point farthest along a
 * direction, `s(d) = argmax_{p in S} p . d`, the mapping GJK and EPA query a
 * convex solid through (Gilbert, Johnson and Keerthi 1988; van den Bergen 2003,
 * "Collision Detection in Interactive 3D Environments", ch. 4).
 *
 * A sphere's is its centre plus its radius along the direction; a capsule's the
 * axis end farther along it plus the radius; a box's the corner whose signs
 * match the direction's in the box frame; a hull's the vertex of greatest dot
 * product. A zero direction returns the shape's centre.
 *
 * @param pose The shape's parent pose, world metres.
 * @param shape The shape.
 * @param direction A world direction; its length is not used.
 * @returns The support point, world metres.
 */
export function physicalShapeSupport(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
  direction: IAutoMovieVector3,
): IAutoMovieVector3 {
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  const centre: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, shape.transform.position),
  );
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(rotation),
    direction,
  );
  const length: number = Vector3.length(local);
  const unit: IAutoMovieVector3 =
    length > 0
      ? { x: local.x / length, y: local.y / length, z: local.z / length }
      : { x: 0, y: 0, z: 0 };
  let point: IAutoMovieVector3;
  if (shape.kind === "sphere") point = Vector3.scale(unit, shape.radius);
  else if (shape.kind === "capsule")
    point = {
      x: unit.x * shape.radius,
      y:
        (unit.y >= 0 ? shape.halfLength : -shape.halfLength) +
        unit.y * shape.radius,
      z: unit.z * shape.radius,
    };
  else if (shape.kind === "box")
    point = {
      x: local.x >= 0 ? shape.halfExtents.x : -shape.halfExtents.x,
      y: local.y >= 0 ? shape.halfExtents.y : -shape.halfExtents.y,
      z: local.z >= 0 ? shape.halfExtents.z : -shape.halfExtents.z,
    };
  else if (shape.kind === "hull") {
    point = shape.points[0]!;
    let best: number = Vector3.dot(point, local);
    for (const candidate of shape.points) {
      const dot: number = Vector3.dot(candidate, local);
      if (dot > best) {
        best = dot;
        point = candidate;
      }
    }
  } else {
    shape satisfies never;
    throw new Error("Unknown physical shape kind");
  }
  return Vector3.add(centre, Quaternion.rotateVector(rotation, point));
}
