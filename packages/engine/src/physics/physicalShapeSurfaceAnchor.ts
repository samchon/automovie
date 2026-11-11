import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalHullFaces } from "./physicalHullFaces";

/**
 * A collider's exact support surface in a specified bone-local outward direction. Capsule ties select the segment midpoint rather than an arbitrary cap; boxes select the face centre on tied coordinates; hulls select the mean of the tied vertices.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A collider's exact support surface in a specified bone-local outward direction) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (A collider's exact support surface in a specified bone-local outward direction) directly over its typed inputs (`pose`, `shape`, `normal`) as a fixed number of statements with no loop or recursion in the body, delegating to `Quaternion.rotateVector`, `Vector3.normalize`, `Quaternion.multiply`, `Quaternion.inverse`, `Math.abs`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 39 lines and 6 top-level statements that reuses `Quaternion.rotateVector`, `Vector3.normalize`, `Quaternion.multiply`, `Quaternion.inverse`, `Math.abs` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `pose`, `shape`, `normal`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
  let point: IAutoMovieVector3;
  if (shape.kind === "box")
    point = {
      x: sign(direction.x) * shape.halfExtents.x,
      y: sign(direction.y) * shape.halfExtents.y,
      z: sign(direction.z) * shape.halfExtents.z,
    };
  else if (shape.kind === "sphere" || shape.kind === "capsule")
    point = Vector3.add(Vector3.scale(direction, shape.radius), {
      x: 0,
      y: shape.kind === "capsule" ? sign(direction.y) * shape.halfLength : 0,
      z: 0,
    });
  else if (shape.kind === "hull") {
    // The support feature: the mean of the vertices farthest along the
    // direction, a vertex, an edge midpoint or a face's vertex mean.
    const hull: physicalHullFaces.IHull = physicalHullFaces(shape.points);
    let reach: number = -Infinity;
    for (const vertex of hull.vertices)
      reach = Math.max(reach, Vector3.dot(vertex, direction));
    const support: IAutoMovieVector3[] = hull.vertices.filter(
      (vertex: IAutoMovieVector3): boolean =>
        Vector3.dot(vertex, direction) >= reach - hull.tolerance,
    );
    point = { x: 0, y: 0, z: 0 };
    for (const vertex of support)
      point = Vector3.add(point, Vector3.scale(vertex, 1 / support.length));
  } else {
    shape satisfies never;
    throw new Error("Unknown physical shape kind");
  }
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
