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
 * @param pose Parent pose in world metres and an admitted unit rotation.
 * @param shape Admitted local shape geometry and transform, in metres.
 * @returns Fresh world-axis minimum and maximum coordinates.
 * @throws {Error} For an unknown runtime shape kind; admission of numeric geometry remains the caller's responsibility.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States supported geometry, world/local transforms, metre units, fresh bounds and the admitted-input premise.
 * @evidence contracts/development/implementation.md#principled-implementation Composes the parent and shape transforms, then uses exact sphere/capsule/box axis extents or the rotated hull vertices' extrema in the existing arithmetic order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The original pose entry composes centre and rotation; fromFrame owns their shared numerical bounds reader and also serves floor support candidates' already composed frame.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every shape formula, component extremum, unknown-kind failure and lack of numeric admission here; bounds are not replaced with support-candidate minima or a new tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(1) work for sphere/capsule/box and O(V) for V hull vertices; legacy bounds have constant live auxiliary storage, while an optional fromFrame collector owns its V transferred outputs without a context object or repeated rotations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both entries use the same fromFrame equations; current composed-frame readers may additionally adopt each fresh rotated hull point only after its extrema are consumed, avoiding a second identical rotation. Legacy calls always freshly read inputs and request no point transfer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps no pose, shape, frame or result globally; min/max are fresh and independent of adopted hull points, whose ownership transfers only after every bounds component has consumed them.
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
  return physicalShapeBounds.fromFrame(center, rotation, shape);
}

/**
 * Bounds on a freshly composed shape frame, shared by the legacy pose entry
 * and consumers that need this same frame for another geometric reading.
 *
 * @evidence contracts/development/design.md#principled-representation A world centre and world orientation already include the shape transform; fromFrame reads the same admitted shape geometry without recomposing it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pose facade and HumanFloorReading share one bounds owner; the latter adopts already consumed fresh hull points for actual support candidates, without a cache, context record or barrel identity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Inputs are current geometric values with an explicit frame premise, not a cached answer or identity key; no shape or input validation is skipped from the existing owner.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the composed-frame convention, actual consumers and absence of retained query data.
 */
export namespace physicalShapeBounds {
  /**
   * Read bounds from an actual composed shape centre and orientation.
   * The centre is in world metres and rotation includes both parent and
   * local shape rotation; shape.transform has already been applied and is
   * not applied again. All shape geometry is admitted by the caller.
   *
   * This is the same numerical owner as physicalShapeBounds: sphere,
   * capsule and box extents retain their original expressions and hull
   * extrema retain original vertex order. It mutates and retains no input.
   *
   * @param takeHullPoint Optional synchronous ownership transfer of each fresh rotated hull offset in world axes, before translation and after extrema consumption. It may adopt or mutate that vector but must not change the shape or current frame.
   */
  export function fromFrame(
    center: IAutoMovieVector3,
    rotation: P.ITransform["rotation"],
    shape: P.IShape,
    takeHullPoint?: (point: IAutoMovieVector3) => void,
  ): { min: IAutoMovieVector3; max: IAutoMovieVector3 } {
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
        takeHullPoint?.(world);
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
}
