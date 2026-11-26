import {
  type IAutoMovieDrawingCellSection,
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingPoint,
  IAutoMovieHalfSpacePlane,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { AUTOMOVIE_DRAWING_CELL_BOUND } from "../constants/AUTOMOVIE_DRAWING_CELL_BOUND";
import { AUTOMOVIE_DRAWING_EPSILON } from "../constants/AUTOMOVIE_DRAWING_EPSILON";

/**
 * Cross-section of one convex cell on the cut plane, as an unrounded page
 * polygon.
 *
 * Each world half-space `normal . p <= offset` becomes the page half-plane `a x
 * + b y <= c` through the frame's origin, right and up axes, and the section is
 * what survives clipping a square of half-extent
 * {@link AUTOMOVIE_DRAWING_CELL_BOUND} by all of them. The square is what makes
 * an unbounded cell detectable: a result that still reaches it was never closed
 * by the design, so `bounded` is `false` and the caller reports a gap instead
 * of printing the square as a room.
 *
 * An empty `polygon` with `bounded: true` means the plane misses the cell. A
 * half-space parallel to the page keeps or removes the whole section by which
 * side of it the plane lies on.
 *
 * @param frame Orthonormal page basis of the view.
 * @param planes The cell's half-spaces; normals need not be unit length.
 * @returns The section's page corners in metres, counter-clockwise, and whether
 *   the cell closed it.
 */
export const autoMovieDrawingCellSection = (
  frame: IAutoMovieDrawingFrame,
  planes: readonly IAutoMovieHalfSpacePlane[],
): IAutoMovieDrawingCellSection.IResult => {
  const bound: number = AUTOMOVIE_DRAWING_CELL_BOUND;
  let polygon: IAutoMovieDrawingPoint[] = [
    { x: -bound, y: -bound },
    { x: bound, y: -bound },
    { x: bound, y: bound },
    { x: -bound, y: bound },
  ];
  for (const plane of planes) {
    const a: number = Vector3.dot(plane.normal, frame.right);
    const b: number = Vector3.dot(plane.normal, frame.up);
    const c: number = plane.offset - Vector3.dot(plane.normal, frame.origin);
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
  const bounded: boolean = polygon.every(
    (point: IAutoMovieDrawingPoint): boolean =>
      Math.abs(point.x) < bound - AUTOMOVIE_DRAWING_EPSILON &&
      Math.abs(point.y) < bound - AUTOMOVIE_DRAWING_EPSILON,
  );
  return { polygon, bounded };
};

/** Keep the part of a convex page polygon where `a x + b y <= c`. */
const clipHalfPlane = (
  polygon: readonly IAutoMovieDrawingPoint[],
  a: number,
  b: number,
  c: number,
): IAutoMovieDrawingPoint[] => {
  const out: IAutoMovieDrawingPoint[] = [];
  for (let index: number = 0; index < polygon.length; ++index) {
    const current: IAutoMovieDrawingPoint = polygon[index]!;
    const next: IAutoMovieDrawingPoint = polygon[(index + 1) % polygon.length]!;
    const dCurrent: number = a * current.x + b * current.y - c;
    const dNext: number = a * next.x + b * next.y - c;
    if (dCurrent <= 0) out.push(current);
    if (dCurrent * dNext < 0) {
      const t: number = dCurrent / (dCurrent - dNext);
      out.push({
        x: current.x + (next.x - current.x) * t,
        y: current.y + (next.y - current.y) * t,
      });
    }
  }
  return out;
};
