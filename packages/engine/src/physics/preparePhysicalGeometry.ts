import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalShapeBounds,
  IAutoMoviePhysicalShapeNearest,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalShapeNearest } from "./physicalShapeNearest";
import { physicalShapePairContact } from "./physicalShapePairContact";

/**
 * Prepare exact convex geometric queries in the engine's own geometry: no
 * dynamics world, steps or impulses. A returned contact keeps a null
 * impulse, so a geometric witness cannot pass for a solver result.
 *
 * A contact is the least signed distance over both colliders' wire frames
 * (`physicalShapePairContact`): exact while they are apart, and the depth
 * of the deepest wire inside the other solid while they overlap. Two
 * colliders whose bounds are farther apart than the prediction on some
 * axis are not queried. The projection of a point is the collider's
 * nearest surface point (`physicalShapeNearest`), from inside as from
 * outside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose, the null-impulse authority, the contact and projection methods and the bounds cull.
 * @evidence contracts/development/implementation.md#principled-implementation Two convex solids come nearest on an edge or a round axis of one of them (Ericson, "Real-Time Collision Detection", 2005, ch. 5 and 9); separated bounds on one axis prove a gap of at least that separation, so the cull never drops a contact within the prediction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three small queries over the engine's shape owners; no option or layer beyond the documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance or margin is added: the cull compares bounds with the prediction exactly, and every remaining pair is measured exactly.
 * @evidence contracts/development/implementation.md#efficient-algorithms A culled pair costs two bounds; a measured pair one proximity query per wire of each shape.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Hull wire frames are shared per point list by `physicalShapePairDistance`.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The queries retain nothing; the asynchronous signature is kept for its existing callers and resolves at once.
 */
export async function preparePhysicalGeometry(): Promise<IAutoMoviePreparePhysicalGeometry.IQueries> {
  return {
    contact: (
      a: IAutoMoviePreparePhysicalGeometry.ICollider,
      b: IAutoMoviePreparePhysicalGeometry.ICollider,
      seconds: number,
      prediction: number = 0,
    ): IAutoMovieContactReceipt | null => {
      if (
        !Number.isFinite(seconds) ||
        !Number.isFinite(prediction) ||
        prediction < 0
      )
        throw new Error("Invalid physical contact query time or prediction");
      const boundsA: IAutoMoviePhysicalShapeBounds.IResult =
        physicalShapeBounds(a.pose, a.shape);
      const boundsB: IAutoMoviePhysicalShapeBounds.IResult =
        physicalShapeBounds(b.pose, b.shape);
      if (
        AXES.some(
          (axis: keyof IAutoMovieVector3): boolean =>
            Math.max(
              boundsA.min[axis] - boundsB.max[axis],
              boundsB.min[axis] - boundsA.max[axis],
            ) > prediction,
        )
      )
        return null;
      const measured: physicalShapePairContact.IResult =
        physicalShapePairContact(a.pose, a.shape, b.pose, b.shape);
      if (!Number.isFinite(measured.distance))
        throw new Error("Nonfinite geometric contact distance");
      if (measured.distance > prediction) return null;
      return {
        id: `geometry:${a.body}/${a.bone}/${a.shape.id}:${b.body}/${b.bone}/${b.shape.id}:${seconds}`,
        source: "geometric",
        seconds,
        endSeconds: seconds,
        a: {
          body: a.body,
          bone: a.bone,
          shape: a.shape.id,
          material: a.shape.material,
        },
        b: {
          body: b.body,
          bone: b.bone,
          shape: b.shape.id,
          material: b.shape.material,
        },
        point: Vector3.scale(
          Vector3.add(measured.pointA, measured.pointB),
          0.5,
        ),
        normal: measured.normal,
        impulse: null,
        separation: measured.distance,
        compression: Math.max(0, -measured.distance),
      };
    },
    minimumY: (collider: IAutoMoviePreparePhysicalGeometry.ICollider): number =>
      physicalShapeBounds(collider.pose, collider.shape).min.y,
    project: (
      collider: IAutoMoviePreparePhysicalGeometry.ICollider,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      const near: IAutoMoviePhysicalShapeNearest.IResult = physicalShapeNearest(
        collider.pose,
        collider.shape,
        point,
        point,
      );
      return { ...near.point };
    },
  };
}

/** The three world axes. */
const AXES: readonly (keyof IAutoMovieVector3)[] = ["x", "y", "z"];
