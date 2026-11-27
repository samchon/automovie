import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeBounds,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";

/**
 * Exact world axis bounds of the admitted sphere, Y capsule, oriented box or
 * convex hull; a hull's bounds are those of its rotated points.
 *
 * @param pose Parent pose in world metres and an admitted unit rotation.
 * @param shape Admitted local shape geometry and transform, in metres.
 * @returns Fresh world-axis minimum and maximum coordinates.
 * @throws {Error} For an unknown runtime shape kind; admission of numeric
 *   geometry remains the caller's responsibility.
 */
function physicalShapeBounds(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
): IAutoMoviePhysicalShapeBounds.IResult {
  // Read the parent position before rotation, as the original add operands do.
  const origin: IAutoMovieVector3 = pose.position;
  const center: IAutoMovieVector3 = Quaternion.rotateVector(
    pose.rotation,
    shape.transform.position,
  );
  center.x = origin.x + center.x;
  center.y = origin.y + center.y;
  center.z = origin.z + center.z;
  const rotation: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  return physicalShapeBoundsFromFrame(center, rotation, shape);
}

  /**
   * The exact world-axis minimum Y, metres, for a floor-only observation.
   * Compose the needed components of the same admitted parent/local frame,
   * keeping its original Y expression, vertex order and Math.min/NaN behavior.
   * Every shape remains queried; only unused axes/maxima and result records are
   * omitted. Sphere/capsule/box are constant work and hulls scan V points.
   * KnockdownFloor consumes this scalar in both floor reductions. Each call
   * reads current geometry and releases its frame/vertex temporaries on
   * return.
   */
function physicalShapeBoundsLowest(
    pose: IAutoMovieRigidTransform,
    shape: IAutoMoviePhysicalShape,
  ): number {
    const origin: IAutoMovieVector3 = pose.position;
    const offsetY: number = Quaternion.rotateVectorY(
      pose.rotation,
      shape.transform.position,
    );
    const centerY: number = origin.y + offsetY;
    if (shape.kind === "sphere") return centerY - shape.radius;
    const rotation: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
      pose.rotation,
      shape.transform.rotation,
    );
    return lowestFromShapeFrame(centerY, rotation, shape);
  }

  /**
   * Exact minimum Y from an actual parent's world Y and unit rotation. The
   * shape's local transform is still applied here. This shares lowest's
   * numerical owner without asking a floor-only caller to construct unused
   * parent X/Z coordinates or a transform wrapper. Inputs are admitted by the
   * caller; every actual shape and hull vertex remains observed.
   */
function physicalShapeBoundsLowestFromParent(
    parentY: number,
    parentRotation: IAutoMovieRigidTransform["rotation"],
    shape: IAutoMoviePhysicalShape,
  ): number {
    const centerY: number =
      parentY +
      Quaternion.rotateVectorY(parentRotation, shape.transform.position);
    if (shape.kind === "sphere") return centerY - shape.radius;
    return lowestFromShapeFrame(
      centerY,
      Quaternion.multiply(parentRotation, shape.transform.rotation),
      shape,
    );
  }

  /**
   * Read bounds from an actual composed shape centre and orientation. The
   * centre is in world metres and rotation includes both parent and local shape
   * rotation; shape.transform has already been applied and is not applied
   * again. All shape geometry is admitted by the caller.
   *
   * This is the same numerical owner as physicalShapeBounds: sphere, capsule
   * and box extents retain their original expressions and hull extrema retain
   * original vertex order. It mutates and retains no input.
   *
   * @param takeHullPoint Optional synchronous ownership transfer of each fresh
   *   rotated hull offset in world axes, before translation and after extrema
   *   consumption. It may adopt or mutate that vector but must not change the
   *   shape or current frame.
   */
function physicalShapeBoundsFromFrame(
    center: IAutoMovieVector3,
    rotation: IAutoMovieRigidTransform["rotation"],
    shape: IAutoMoviePhysicalShape,
    takeHullPoint?: (point: IAutoMovieVector3) => void,
  ): { min: IAutoMovieVector3; max: IAutoMovieVector3 } {
    if (shape.kind === "sphere") return sphereBounds(center, shape.radius);
    let extent: IAutoMovieVector3;
    if (shape.kind === "capsule") {
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
        const world: IAutoMovieVector3 = Quaternion.rotateVector(
          rotation,
          point,
        );
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

/** Internal entry points for the composed physical-shape bounds queries. */
export const physicalShapeBoundsImplementation: {
  physicalShapeBounds: typeof physicalShapeBounds;
  physicalShapeBoundsLowest: typeof physicalShapeBoundsLowest;
  physicalShapeBoundsLowestFromParent: typeof physicalShapeBoundsLowestFromParent;
  physicalShapeBoundsFromFrame: typeof physicalShapeBoundsFromFrame;
} = {
  physicalShapeBounds,
  physicalShapeBoundsLowest,
  physicalShapeBoundsLowestFromParent,
  physicalShapeBoundsFromFrame,
};

/**
 * A sphere's six original centre-plus/minus-radius expressions need no
 * orientation.
 */
function sphereBounds(
  center: IAutoMovieVector3,
  radius: number,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } {
  return {
    min: { x: center.x - radius, y: center.y - radius, z: center.z - radius },
    max: { x: center.x + radius, y: center.y + radius, z: center.z + radius },
  };
}

/** Fixed unit directions are read without mutation by quaternion rotation. */
const AXIS_X: Readonly<IAutoMovieVector3> = { x: 1, y: 0, z: 0 };

/** Capsule's length axis and the second oriented-box column. */
const AXIS_Y: Readonly<IAutoMovieVector3> = { x: 0, y: 1, z: 0 };

/** Third oriented-box column, shared without caller-owned geometry. */
const AXIS_Z: Readonly<IAutoMovieVector3> = { x: 0, y: 0, z: 1 };

/**
 * One original minimum-Y kernel consumes already composed non-spherical shape
 * frames.
 */
function lowestFromShapeFrame(
  centerY: number,
  rotation: IAutoMovieRigidTransform["rotation"],
  shape: Exclude<IAutoMoviePhysicalShape, { kind: "sphere" }>,
): number {
  if (shape.kind === "capsule") {
    const axis: number = Quaternion.rotateVectorY(rotation, AXIS_Y);
    return centerY - (Math.abs(axis) * shape.halfLength + shape.radius);
  }
  if (shape.kind === "box") {
    const x: number = Quaternion.rotateVectorY(rotation, AXIS_X);
    const y: number = Quaternion.rotateVectorY(rotation, AXIS_Y);
    const z: number = Quaternion.rotateVectorY(rotation, AXIS_Z);
    const extent: number =
      Math.abs(x) * shape.halfExtents.x +
      Math.abs(y) * shape.halfExtents.y +
      Math.abs(z) * shape.halfExtents.z;
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
