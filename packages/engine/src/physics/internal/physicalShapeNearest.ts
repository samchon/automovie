import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalShapeQueryImplementation } from "./physicalShapeQueryImplementation";

/*
 * Where a world segment comes nearest an admitted sphere, Y capsule, oriented
 * box or convex hull placed by a parent pose: the signed distance, negative
 * when the segment enters the shape, the point of the shape's surface there,
 * the outward normal at that point and the point of the segment. A segment
 * whose two ends coincide is a point, so this is also the point query.
 *
 * The shape's frame is the parent pose composed with the shape's own transform,
 * as in `physicalShapeBounds`. A sphere is its centre and a capsule its axis
 * segment, each widened by the radius, so both reduce to the closest points
 * between two segments (`closestPointsBetweenSegments`, Eberly 2023); the
 * normal runs from the axis point to the segment point. A hull's nearest or
 * deepest segment parameter is exact from `physicalHullSegment`. A box is
 * convex, so its signed distance is convex along the segment, and 44
 * golden-section steps narrow the segment's unit parameter below 1e-9 before
 * the least of both ends and the two final probes is taken. The point and the
 * normal are read at that parameter from the box's exact signed distance or
 * from `physicalHullNearest`.
 *
 * When the segment passes through a sphere's centre or a capsule's axis, no
 * direction is nearest; the normal is then the shape's local X axis, a
 * direction perpendicular to a capsule's axis.
 *
 * A segment widened by a radius that runs linearly from one end to the other (a
 * tapered capsule, the round cone of a limb that narrows toward its far joint)
 * is read by the same search: its signed distance is the least over the
 * segment's points of the point's signed distance less the radius there. The
 * point's distance to a convex shape is convex along the segment (the distance
 * to a convex set is a convex function and the segment's points are affine in
 * the parameter), and the radius is affine in it, so the difference is convex
 * and the golden-section search finds its minimum for every shape kind, a
 * sphere and a capsule included.
 * Parameter pose: The shape's parent pose, world metres.
 * Parameter shape: The admitted shape.
 * Parameter a: One end of the segment, world metres.
 * Parameter b: The other end, world metres.
 * Parameter taper: The radii the segment is widened by at `a` and at `b`, metres,
 * not negative; absent for the bare segment.
 * Returns: The signed distance in metres (less the widening, for a tapered
 * segment), the surface point, the outward unit normal and the segment point,
 * all in the world frame.
 */
export function physicalShapeNearest(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper?: readonly [number, number],
): IAutoMoviePhysicalShapeNearest.IResult {
  return physicalShapeQueryImplementation.physicalShapeQueryDirect(pose, shape, a, b, taper, true);
}
