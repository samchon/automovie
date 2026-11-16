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
 * @evidence contracts/development/common.md#meaningful-documentation States supported geometry, admitted transforms, world metres and fresh full bounds. Namespace lowest returns only the same world minimum Y for floor readers; it retains no point, frame or result and leaves each full/collected-hull path unchanged.
 * @evidence contracts/development/implementation.md#principled-implementation Composes the parent and shape transforms, then uses exact sphere/capsule/box axis extents or the rotated hull vertices' extrema in the existing arithmetic order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The pose facade and lowest compose the same actual frame. FromFrame owns full bounds and optional hull-point transfer; lowest reads just the corresponding Y expression without unused coordinate/extrema records. Both remain with the geometry's one package owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every shape formula, component extremum, unknown-kind failure and lack of numeric admission here; bounds are not replaced with support-candidate minima or a new tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Sphere/capsule/box cost O(1), hulls O(V). Full hull bounds keep scalar extrema and materialize only each rotated point needed by full coordinates/optional transfer. Lowest composes centre Y with rotateVectorY without centre/offset vectors, and uses the same scalar owner for axes/vertices without unused coordinates/maxima. A sphere needs no composed shape orientation. Collector outputs alone retain O(V) points; both paths share fixed unit axes.
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pose facade, HumanFloorReading's adopted hull points and KnockdownFloor's scalar lowest observation share this one bounds owner. Only the actually demanded field/points escape, without a cache, extra representation or caller-supplied derived-answer flag.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Inputs are current geometric values with an explicit frame premise, not a cached answer or identity key; no shape or input validation is skipped from the existing owner.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the composed-frame convention, actual consumers and absence of retained query data.
 */
export namespace physicalShapeBounds {
  /**
   * The exact world-axis minimum Y, metres, for a floor-only observation.
   * Compose the needed components of the same admitted parent/local frame,
   * keeping its original Y expression, vertex order and Math.min/NaN behavior.
   * Every shape remains queried; only unused axes/maxima and result records
   * are omitted. Sphere/capsule/box are constant work and hulls scan V points.
   * KnockdownFloor consumes this scalar in both floor reductions. Each call
   * reads current geometry and releases its frame/vertex temporaries on return.
   */
  export function lowest(pose: P.ITransform, shape: P.IShape): number {
    const centerY: number = pose.position.y + Quaternion.rotateVectorY(
      pose.rotation, shape.transform.position,
    );
    if (shape.kind === "sphere") return centerY - shape.radius;
    const rotation: P.ITransform["rotation"] = Quaternion.multiply(pose.rotation, shape.transform.rotation);
    if (shape.kind === "capsule") {
      const axis: number = Quaternion.rotateVectorY(rotation, AXIS_Y);
      return centerY - (Math.abs(axis) * shape.halfLength + shape.radius);
    }
    if (shape.kind === "box") {
      const x: number = Quaternion.rotateVectorY(rotation, AXIS_X);
      const y: number = Quaternion.rotateVectorY(rotation, AXIS_Y);
      const z: number = Quaternion.rotateVectorY(rotation, AXIS_Z);
      const extent: number = Math.abs(x) * shape.halfExtents.x +
        Math.abs(y) * shape.halfExtents.y + Math.abs(z) * shape.halfExtents.z;
      return centerY - extent;
    }
    if (shape.kind === "hull") {
      let minimum: number = Infinity;
      for (const point of shape.points)
        minimum = Math.min(minimum, Quaternion.rotateVectorY(rotation, point));
      return centerY + minimum;
    }
    shape satisfies never;
    throw new Error("Unknown physical shape kind");
  }

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
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, AXIS_Y);
      extent = {
        x: Math.abs(axis.x) * shape.halfLength + shape.radius,
        y: Math.abs(axis.y) * shape.halfLength + shape.radius,
        z: Math.abs(axis.z) * shape.halfLength + shape.radius,
      };
    } else if (shape.kind === "hull") {
      // A hull's bounds are its vertices' bounds about the shape centre.
      let minX: number = Infinity;
      let minY: number = Infinity;
      let minZ: number = Infinity;
      let maxX: number = -Infinity;
      let maxY: number = -Infinity;
      let maxZ: number = -Infinity;
      for (const point of shape.points) {
        const world: IAutoMovieVector3 = Quaternion.rotateVector(rotation, point);
        minX = Math.min(minX, world.x);
        minY = Math.min(minY, world.y);
        minZ = Math.min(minZ, world.z);
        maxX = Math.max(maxX, world.x);
        maxY = Math.max(maxY, world.y);
        maxZ = Math.max(maxZ, world.z);
        takeHullPoint?.(world);
      }
      return {
        min: { x: center.x + minX, y: center.y + minY, z: center.z + minZ },
        max: { x: center.x + maxX, y: center.y + maxY, z: center.z + maxZ },
      };
    } else if (shape.kind === "box") {
      const x: IAutoMovieVector3 = Quaternion.rotateVector(rotation, AXIS_X);
      const y: IAutoMovieVector3 = Quaternion.rotateVector(rotation, AXIS_Y);
      const z: IAutoMovieVector3 = Quaternion.rotateVector(rotation, AXIS_Z);
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

/** Fixed unit directions are read without mutation by quaternion rotation. */
const AXIS_X: Readonly<IAutoMovieVector3> = { x: 1, y: 0, z: 0 };

/** Capsule's length axis and the second oriented-box column. */
const AXIS_Y: Readonly<IAutoMovieVector3> = { x: 0, y: 1, z: 0 };

/** Third oriented-box column, shared without caller-owned geometry. */
const AXIS_Z: Readonly<IAutoMovieVector3> = { x: 0, y: 0, z: 1 };
