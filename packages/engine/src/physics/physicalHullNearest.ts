import type {
  IAutoMoviePhysicalHullNearest,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readPhysicalHullPoint } from "./readPhysicalHullPoint";

/**
 * Read only signed metres from the same hull query. Every plane/edge test,
 * first-winner comparison and volume refusal still runs; only unobserved
 * final contact records are omitted. The implementation below owns both modes.
 */
export function physicalHullNearest(
  points: readonly IAutoMovieVector3[],
  p: IAutoMovieVector3,
  details: false,
): number;

/**
 * Preserve the original two-argument full-contact signature and its result
 * type. It remains the last overload for Parameters/ReturnType consumers.
 */
export function physicalHullNearest(
  points: readonly IAutoMovieVector3[],
  p: IAutoMovieVector3,
): { distance: number; point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/**
 * The nearest surface point of a convex hull to a point in the hull's own
 * frame, with the outward normal there and the signed distance, negative
 * inside.
 *
 * Inside, the nearest surface point is the projection onto the face whose
 * plane is closest, and the normal is that face's. Outside, it is the
 * projection onto a facing face when that projection falls within the face's
 * loop, and otherwise the nearest point on the edges of the facing faces;
 * the normal then points from the surface point to the query point.
 *
 * The planes and the edges are read from flat arrays built once per hull: a
 * projection falls within a face's loop when it lies on the inner side of
 * each edge, which is the sign of one product with the edge's inward
 * direction in the face (the face normal crossed with the edge), as the
 * query point and its projection differ along the normal only.
 *
 * @param points The hull's shape-local points, metres, spanning a volume.
 * @param p The query point in the same frame.
 * @param details False for the distance alone; omitted for the original full contact.
 * @returns Signed metres in scalar mode; otherwise that distance with the
 *   original surface point and outward unit normal in the points' frame.
 * @throws {Error} When the points span no volume.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both geometric cases, scalar/full result modes, contact features, signed metre frame, volume refusal and the flat form read by both overloads.
 * @evidence contracts/development/implementation.md#principled-implementation The signed distance of a convex polytope from its half-space form (Ericson, Real-Time Collision Detection, section 5.1): the greatest plane distance when no plane is in front, and the Voronoi region of a face or an edge of the facing faces otherwise; a vertex region is the end of an edge. The inner-side test is the edge's triple product with the projection written as one product with the precomputed in-face direction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One point-to-hull body serves the original contact and scalar modes. physicalShapeQuery supplies the actual shape-local point, while physicalHullSegment continues to own segment minimization; typed-array plane/edge loops keep the original arithmetic.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance, plane/edge order, deepest/least comparison, early return or volume refusal changes. Scalar mode omits only final contact fields; full mode retains its fresh point and original borrowed/copy normal policies. Bounded loop indices justify the existing non-null assertions.
 * @evidence contracts/development/implementation.md#efficient-algorithms Keeps the full plane scan, facing-edge tests and original squared-distance/root work. Scalar queries avoid the unobserved final wrapper and point/normal records, including every search probe of a tapered hull; no distance or geometric candidate is omitted.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both modes share this one distance calculation and the existing physicalHullFaces/flat geometry owners. The unchanged weak hull preparation and plane-distance workspace serve every actual query; no target or point result is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Existing weak flat forms live with their hull records, and the existing distance buffer grows to the largest queried hull and is overwritten per call. Scalar mode returns only a number; full mode keeps its original contact ownership, with no new persistent state.
 */
export function physicalHullNearest(
  points: readonly IAutoMovieVector3[],
  p: IAutoMovieVector3,
  details: boolean = true,
): IAutoMoviePhysicalHullNearest.IResult | number {
  return readPhysicalHullPoint(points, p, details);
}
