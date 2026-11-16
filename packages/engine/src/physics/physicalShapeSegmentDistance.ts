import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { physicalShapeQuery } from "./physicalShapeQuery";

/**
 * The signed distance, metres, from a world segment to an admitted sphere, Y
 * capsule, oriented box or convex hull placed by a parent pose: the least
 * distance over the segment's points to the shape's surface, negative when
 * the segment enters it. A segment whose two ends coincide is a point, so
 * this is also the point-to-shape distance. A segment widened by a radius
 * running linearly from `a` to `b` (a tapered capsule) reads its own signed
 * distance: the least over its points of the distance less the radius there.
 *
 * It uses the same physicalShapeQuery numerical owner as physicalShapeNearest,
 * retaining the actual distance while omitting unobserved final contact fields.
 *
 * @param pose The shape's parent pose, world metres.
 * @param shape The admitted shape.
 * @param a One end of the segment, world metres.
 * @param b The other end, world metres.
 * @param taper The radii the segment is widened by at `a` and at `b`, metres; absent for the bare segment.
 * @returns The signed distance, metres; negative inside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sign, the point case and which owner computes the reading.
 * @evidence contracts/development/implementation.md#principled-implementation The same physicalShapeQuery numerical owner as the full nearest reading, in scalar mode; it omits only unobserved final fields and preserves the actual signed distance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar-mode delegation to the shared query; curlChainUntilContact and motion colliders keep their existing distance-only facade.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance, cast or branch; the value is the owner's.
 * @evidence contracts/development/implementation.md#efficient-algorithms The shared query's shape/segment work, without unobserved final contact materialization; hull work still depends on its faces and edges.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Full nearest and distance-only reads share one query implementation and private shape-distance owners without a cross-query cache.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing between calls; its temporaries die with the call.
 */
export function physicalShapeSegmentDistance(
  pose: P.ITransform,
  shape: P.IShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper?: readonly [number, number],
): number {
  return physicalShapeQuery(pose, shape, a, b, taper, false);
}

/**
 * Fixed-geometry preparation for the distance facade's actual repeated-query
 * consumers; each changed segment still runs its original physical query.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines one synchronous unchanged-pose/shape operation and lazy original-use geometry shared by its varying world segments.
 * @evidence contracts/development/design.md#principled-representation An opaque distance reader captures the actual pose/shape rather than accepting derived frame numbers, target answers or replacement callbacks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves the actual deepest probes through HumanArmShapes, HumanColliders.cast's point phases and one HumanArmOvershoot candidate's wrist/forearm samples; the original function remains the cold one-off facade.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only fixed shape geometry is shared through the common query owner; every segment, bound, query order and signed distance remains actual, with no global or result cache.
 */
export namespace physicalShapeSegmentDistance {
  /**
   * Borrow a pose and shape unchanged through one synchronous operation.
   * Construction reads no component; first actual use prepares geometry and
   * each following segment still runs all original proximity mathematics.
   * Release the reader with the operation; it retains no queried point,
   * taper or result and exposes no private frame.
   */
  export function prepare(
    pose: P.ITransform,
    shape: P.IShape,
  ): ReturnType<typeof physicalShapeQuery.prepare> {
    return physicalShapeQuery.prepare(pose, shape);
  }
}
