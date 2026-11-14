import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { physicalShapeNearest } from "./physicalShapeNearest";

/**
 * The signed distance, metres, from a world segment to an admitted sphere, Y
 * capsule, oriented box or convex hull placed by a parent pose: the least
 * distance over the segment's points to the shape's surface, negative when
 * the segment enters it. A segment whose two ends coincide is a point, so
 * this is also the point-to-shape distance. A segment widened by a radius
 * running linearly from `a` to `b` (a tapered capsule) reads its own signed
 * distance: the least over its points of the distance less the radius there.
 *
 * It is the distance of `physicalShapeNearest`, which owns the frame
 * composition and the method for each shape kind.
 *
 * @param pose The shape's parent pose, world metres.
 * @param shape The admitted shape.
 * @param a One end of the segment, world metres.
 * @param b The other end, world metres.
 * @param taper The radii the segment is widened by at `a` and at `b`, metres; absent for the bare segment.
 * @returns The signed distance, metres; negative inside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sign, the point case and which owner computes the reading.
 * @evidence contracts/development/implementation.md#principled-implementation The distance member of the one proximity reading, so a distance and a contact point taken for the same shape and segment cannot disagree.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation to `physicalShapeNearest`; `curlChainUntilContact` and the motions colliders call this when the distance is all they need.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance, cast or branch; the value is the owner's.
 * @evidence contracts/development/implementation.md#efficient-algorithms The owner's constant work per call and nothing more.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments; callers that query many shapes hold their own placed frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing between calls; its temporaries die with the call.
 */
export function physicalShapeSegmentDistance(
  pose: P.ITransform,
  shape: P.IShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper?: readonly [number, number],
): number {
  return physicalShapeNearest(pose, shape, a, b, taper).distance;
}
