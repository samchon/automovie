import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeSurfaceAnchor,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { physicalShapeHull } from "./physicalShapeHull";

/*
 * A collider's exact support surface in a specified bone-local outward
 * direction. Capsule ties select the segment midpoint rather than an arbitrary
 * cap; boxes select the face centre on tied coordinates; hulls select the mean
 * of the tied vertices.
 */
export function physicalShapeSurfaceAnchor(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
  normal: IAutoMovieVector3,
): IAutoMoviePhysicalShapeSurfaceAnchor.IResult {
  const world: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    pose.rotation,
    AutoMovieEngineVector3.normalize(normal),
  );
  const rotation: IAutoMovieRigidTransform["rotation"] = AutoMovieEngineQuaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  const direction: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    AutoMovieEngineQuaternion.inverse(rotation),
    world,
  );
  const sign: (value: number) => number = (value: number): number =>
    Math.abs(value) < 1e-12 ? 0 : Math.sign(value);
  let point: IAutoMovieVector3;
  if (shape.kind === "box")
    point = {
      x: sign(direction.x) * shape.halfExtents.x,
      y: sign(direction.y) * shape.halfExtents.y,
      z: sign(direction.z) * shape.halfExtents.z,
    };
  else if (shape.kind === "sphere" || shape.kind === "capsule")
    point = AutoMovieEngineVector3.add(AutoMovieEngineVector3.scale(direction, shape.radius), {
      x: 0,
      y: shape.kind === "capsule" ? sign(direction.y) * shape.halfLength : 0,
      z: 0,
    });
  else if (shape.kind === "hull") {
    // The support feature: the mean of the vertices farthest along the
    // direction, a vertex, an edge midpoint or a face's vertex mean.
    const hull: IAutoMoviePhysicalHullFaces.IHull = physicalShapeHull(shape);
    let reach: number = -Infinity;
    for (const vertex of hull.vertices)
      reach = Math.max(reach, AutoMovieEngineVector3.dot(vertex, direction));
    const support: IAutoMovieVector3[] = hull.vertices.filter(
      (vertex: IAutoMovieVector3): boolean =>
        AutoMovieEngineVector3.dot(vertex, direction) >= reach - hull.tolerance,
    );
    point = { x: 0, y: 0, z: 0 };
    for (const vertex of support)
      point = AutoMovieEngineVector3.add(point, AutoMovieEngineVector3.scale(vertex, 1 / support.length));
  } else {
    shape satisfies never;
    throw new Error("Unknown physical shape kind");
  }
  return {
    point: AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.add(
        pose.position,
        AutoMovieEngineQuaternion.rotateVector(pose.rotation, shape.transform.position),
      ),
      AutoMovieEngineQuaternion.rotateVector(rotation, point),
    ),
    normal: world,
  };
}
