import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** Exact world axis bounds of the admitted sphere, Y capsule or oriented box. */
export function physicalShapeBounds(
  pose: P.ITransform,
  shape: P.IShape,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } {
  const center: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, shape.transform.position),
  );
  const rotation: P.ITransform["rotation"] = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  let extent: IAutoMovieVector3;
  if (shape.kind === "sphere")
    extent = { x: shape.radius, y: shape.radius, z: shape.radius };
  else if (shape.kind === "capsule") {
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    extent = {
      x: Math.abs(axis.x) * shape.halfLength + shape.radius,
      y: Math.abs(axis.y) * shape.halfLength + shape.radius,
      z: Math.abs(axis.z) * shape.halfLength + shape.radius,
    };
  } else {
    const x: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const y: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const z: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    extent = {
      x:
        Math.abs(x.x) * shape.halfExtents.x +
        Math.abs(y.x) * shape.halfExtents.y +
        Math.abs(z.x) * shape.halfExtents.z,
      y:
        Math.abs(x.y) * shape.halfExtents.x +
        Math.abs(y.y) * shape.halfExtents.y +
        Math.abs(z.y) * shape.halfExtents.z,
      z:
        Math.abs(x.z) * shape.halfExtents.x +
        Math.abs(y.z) * shape.halfExtents.y +
        Math.abs(z.z) * shape.halfExtents.z,
    };
  }
  return {
    min: Vector3.subtract(center, extent),
    max: Vector3.add(center, extent),
  };
}
