import { IAutoMovieDrawingFrame, IAutoMovieDrawingPoint, IAutoMovieHalfSpacePlane } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { AUTOMOVIE_DRAWING_CELL_BOUND } from "./AUTOMOVIE_DRAWING_CELL_BOUND";
import { AUTOMOVIE_DRAWING_EPSILON } from "./AUTOMOVIE_DRAWING_EPSILON";

/**
 * Cross-section of one convex cell on the cut plane, as a page polygon.
 *
 * Each world half-space becomes a half-plane in page coordinates, and the
 * cross-section is what survives clipping a large square by all of them. The
 * square is what makes an unbounded cell detectable: a result that still
 * touches it was never bounded by the design, and the caller says so instead of
 * printing the square as a room.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Derives a logical cell's page polygon and explicitly reports when its authored half-spaces do not bound that section.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Projects each world half-space into the view plane, clips the finite seed polygon, and tests whether any seed boundary survived.
 */
export const autoMovieDrawingCellSection = (
  frame: IAutoMovieDrawingFrame,
  planes: readonly IAutoMovieHalfSpacePlane[],
): { polygon: IAutoMovieDrawingPoint[]; bounded: boolean } => {
  const bound = AUTOMOVIE_DRAWING_CELL_BOUND;
  let polygon: IAutoMovieDrawingPoint[] = [
    { x: -bound, y: -bound },
    { x: bound, y: -bound },
    { x: bound, y: bound },
    { x: -bound, y: bound },
  ];
  for (const plane of planes) {
    const a = Vector3.dot(plane.normal, frame.right);
    const b = Vector3.dot(plane.normal, frame.up);
    const c = plane.offset - Vector3.dot(plane.normal, frame.origin);
    if (
      Math.abs(a) <= AUTOMOVIE_DRAWING_EPSILON &&
      Math.abs(b) <= AUTOMOVIE_DRAWING_EPSILON
    ) {
      // The plane is parallel to the page: it either contains the whole
      // cross-section or removes all of it, and there is no line to clip on.
      if (c < -AUTOMOVIE_DRAWING_EPSILON) return { polygon: [], bounded: true };
      continue;
    }
    polygon = clipHalfPlane(polygon, a, b, c);
    if (polygon.length === 0) return { polygon: [], bounded: true };
  }
  const bounded = polygon.every(
    (point) =>
      Math.abs(point.x) < bound - AUTOMOVIE_DRAWING_EPSILON &&
      Math.abs(point.y) < bound - AUTOMOVIE_DRAWING_EPSILON,
  );
  return { polygon, bounded };
};
