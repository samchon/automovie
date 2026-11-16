import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { physicalShapeQuery } from "./physicalShapeQuery";

/**
 * Where a world segment comes nearest an admitted sphere, Y capsule,
 * oriented box or convex hull placed by a parent pose: the signed distance,
 * negative when the segment enters the shape, the point of the shape's
 * surface there, the outward normal at that point and the point of the
 * segment. A segment whose two ends coincide is a point, so this is also the
 * point query.
 *
 * The shape's frame is the parent pose composed with the shape's own
 * transform, as in `physicalShapeBounds`. A sphere is its centre and a
 * capsule its axis segment, each widened by the radius, so both reduce to
 * the closest points between two segments (`closestPointsBetweenSegments`,
 * Eberly 2023); the normal runs from the axis point to the segment point. A
 * hull's nearest or deepest segment parameter is exact from
 * `physicalHullSegment`. A box is convex, so its signed distance is convex
 * along the segment, and 44 golden-section steps narrow the segment's unit
 * parameter below 1e-9 before the least of both ends and the two final
 * probes is taken. The point and the normal are read at that parameter from
 * the box's exact signed distance or from `physicalHullNearest`.
 *
 * When the segment passes through a sphere's centre or a capsule's axis, no
 * direction is nearest; the normal is then the shape's local X axis, a
 * direction perpendicular to a capsule's axis.
 *
 * A segment widened by a radius that runs linearly from one end to the other
 * (a tapered capsule, the round cone of a limb that narrows toward its far
 * joint) is read by the same search: its signed distance is the least over
 * the segment's points of the point's signed distance less the radius
 * there. The point's distance to a convex shape is convex along the segment
 * (the distance to a convex set is a convex function and the segment's
 * points are affine in the parameter), and the radius is affine in it, so
 * the difference is convex and the golden-section search finds its minimum
 * for every shape kind, a sphere and a capsule included.
 *
 * @param pose The shape's parent pose, world metres.
 * @param shape The admitted shape.
 * @param a One end of the segment, world metres.
 * @param b The other end, world metres.
 * @param taper The radii the segment is widened by at `a` and at `b`, metres, not negative; absent for the bare segment.
 * @returns The signed distance in metres (less the widening, for a tapered
 *   segment), the surface point, the outward unit normal and the segment
 *   point, all in the world frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame composition, the sign, the point case, the method for each shape kind with its precision, and the convention where no nearest direction exists.
 * @evidence contracts/development/implementation.md#principled-implementation The common physicalShapeQuery owner runs the existing closest-segment, exact hull and fixed-search methods in full mode, so distance, point, normal and segment point are still one actual reading.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One full-mode delegation; the shared query owns shape branches and the scalar facade uses that same numerical body.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Full mode preserves every original search step, tie, threshold, normal fallback and world contact field; no distance-only approximation enters a full result.
 * @evidence contracts/development/implementation.md#efficient-algorithms The common query's original closest-segment/exact-hull work or 48 scalar search evaluations plus one final contact reading, with fresh full world output.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Full and scalar public facades use one numerical owner, so omitting unobserved scalar fields does not duplicate or alter the distance mathematics.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the original full contact record and fresh world vectors without retaining the pose, shape, segment or result history.
 */
export function physicalShapeNearest(
  pose: P.ITransform,
  shape: P.IShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper?: readonly [number, number],
): physicalShapeNearest.IResult {
  return physicalShapeQuery(pose, shape, a, b, taper, true);
}

/**
 * The reading of one proximity query.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the record the proximity owner returns; each member states its frame, unit and sign.
 * @evidence contracts/development/design.md#principled-representation One contact reading as the four quantities that define it, all in the world frame, with no optional member: a distance without its point and normal is the split this record removes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by `physicalShapeNearest`; the distance is read by `physicalShapeSegmentDistance` and the colliders, the point and normal by contact laws.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No `any`, `unknown`, index signature or cast; it repeats no type another owner declares.
 */
export namespace physicalShapeNearest {
  /** Where a segment comes nearest a shape. */
  export interface IResult {
    /** Signed distance, metres; negative when the segment enters. */ distance: number;

    /** The nearest point of the shape's surface, world metres. */ point: IAutoMovieVector3;

    /** Outward unit normal of the surface at `point`, world frame. */ normal: IAutoMovieVector3;

    /** The nearest point of the segment, world metres. */ at: IAutoMovieVector3;
  }
}
