import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalShapeQuery } from "./physicalShapeQuery";

/**
 * The signed distance, metres, from a world segment to an admitted sphere, Y
 * capsule, oriented box or convex hull placed by a parent pose: the least
 * distance over the segment's points to the shape's surface, negative when the
 * segment enters it. A segment whose two ends coincide is a point, so this is
 * also the point-to-shape distance. A segment widened by a radius running
 * linearly from `a` to `b` (a tapered capsule) reads its own signed distance:
 * the least over its points of the distance less the radius there.
 *
 * It uses the same physicalShapeQuery numerical owner as physicalShapeNearest,
 * retaining the actual distance while omitting unobserved final contact
 * fields.
 *
 * @param pose The shape's parent pose, world metres.
 * @param shape The admitted shape.
 * @param a One end of the segment, world metres.
 * @param b The other end, world metres.
 * @param taper The radii the segment is widened by at `a` and at `b`, metres;
 *   absent for the bare segment.
 * @returns The signed distance, metres; negative inside.
 */
export function physicalShapeSegmentDistance(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper?: readonly [number, number],
): number {
  return physicalShapeQuery(pose, shape, a, b, taper, false);
}

/**
 * Fixed-geometry preparation for the distance facade's actual repeated-query
 * consumers; each changed segment still runs its original physical query.
 */
export namespace physicalShapeSegmentDistance {
  /**
   * Prepare the fixed frame of an admitted shape from its parent pose.
   * Each query runs the original proximity mathematics on its actual segment
   * and optional taper, without retaining either input or the result.
   */
  export function prepare(
    pose: IAutoMovieRigidTransform,
    shape: IAutoMoviePhysicalShape,
  ): ReturnType<typeof physicalShapeQuery.prepare> {
    return physicalShapeQuery.prepare(pose, shape);
  }
}
