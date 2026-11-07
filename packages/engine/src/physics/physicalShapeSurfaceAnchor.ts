import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** A collider's exact support surface in a specified bone-local outward direction. Capsule ties select the segment midpoint rather than an arbitrary cap; boxes select the face centre on tied coordinates. */
export function physicalShapeSurfaceAnchor(
  pose: P.ITransform,
  shape: P.IShape,
  normal: IAutoMovieVector3,
): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
  const world: IAutoMovieVector3 = Quaternion.rotateVector(
    pose.rotation,
    Vector3.normalize(normal),
  );
  const rotation: P.ITransform["rotation"] = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  const direction: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(rotation),
    world,
  );
  const sign: (value: number) => number = (value: number): number =>
    Math.abs(value) < 1e-12 ? 0 : Math.sign(value);
  const point: IAutoMovieVector3 =
    shape.kind === "box"
      ? {
          x: sign(direction.x) * shape.halfExtents.x,
          y: sign(direction.y) * shape.halfExtents.y,
          z: sign(direction.z) * shape.halfExtents.z,
        }
      : Vector3.add(Vector3.scale(direction, shape.radius), {
          x: 0,
          y:
            shape.kind === "capsule" ? sign(direction.y) * shape.halfLength : 0,
          z: 0,
        });
  return {
    point: Vector3.add(
      Vector3.add(
        pose.position,
        Quaternion.rotateVector(pose.rotation, shape.transform.position),
      ),
      Quaternion.rotateVector(rotation, point),
    ),
    normal: world,
  };
}
