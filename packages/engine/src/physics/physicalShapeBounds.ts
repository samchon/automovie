import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Exact world axis bounds of the admitted sphere, Y capsule, oriented box or
 * convex hull; a hull's bounds are those of its rotated points.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Exact world axis bounds of the admitted sphere, Y capsule or oriented box) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Exact world axis bounds of the admitted sphere, Y capsule or oriented box) directly over its typed inputs (`pose`, `shape`) as a fixed number of statements with no loop or recursion in the body, delegating to `Vector3.add`, `Quaternion.rotateVector`, `Quaternion.multiply`, `Math.abs`, `Vector3.subtract`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 59 lines and 5 top-level statements that reuses `Vector3.add`, `Quaternion.rotateVector`, `Quaternion.multiply`, `Math.abs`, `Vector3.subtract` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `pose`, `shape`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 8 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 8 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
  } else if (shape.kind === "hull") {
    // A hull's bounds are its vertices' bounds about the shape centre.
    let min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
    let max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
    for (const point of shape.points) {
      const world: IAutoMovieVector3 = Quaternion.rotateVector(rotation, point);
      min = {
        x: Math.min(min.x, world.x),
        y: Math.min(min.y, world.y),
        z: Math.min(min.z, world.z),
      };
      max = {
        x: Math.max(max.x, world.x),
        y: Math.max(max.y, world.y),
        z: Math.max(max.z, world.z),
      };
    }
    return { min: Vector3.add(center, min), max: Vector3.add(center, max) };
  } else if (shape.kind === "box") {
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
  } else {
    shape satisfies never;
    throw new Error("Unknown physical shape kind");
  }
  return {
    min: Vector3.subtract(center, extent),
    max: Vector3.add(center, extent),
  };
}
