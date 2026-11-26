import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalShapeBounds,
  IAutoMoviePhysicalShapeNearest,
  IAutoMoviePhysicalShapePairContact,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalShapeNearest } from "./internal/physicalShapeNearest";
import { physicalShapePairContact } from "./internal/physicalShapePairContact";

/**
 * Prepare exact convex geometric queries in the engine's own geometry: no
 * dynamics world, steps or impulses. A returned contact keeps a null impulse,
 * so a geometric witness cannot pass for a solver result.
 *
 * A contact is the least signed distance over both colliders' wire frames
 * (`physicalShapePairContact`): exact while they are apart, and the depth of
 * the deepest wire inside the other solid while they overlap. Two colliders
 * whose bounds are farther apart than the prediction on some axis are not
 * queried. The projection of a point is the collider's nearest surface point
 * (`physicalShapeNearest`), from inside as from outside.
 */
export async function preparePhysicalGeometry(): Promise<IAutoMoviePreparePhysicalGeometry.IQueries> {
  return {
    contact: (
      a: IAutoMoviePreparePhysicalGeometry.ICollider,
      b: IAutoMoviePreparePhysicalGeometry.ICollider,
      seconds: number,
      prediction: number = 0,
    ): IAutoMovieContactReceipt | null => {
      if (prediction < 0)
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
      const measured: IAutoMoviePhysicalShapePairContact =
        physicalShapePairContact(a.pose, a.shape, b.pose, b.shape);

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
