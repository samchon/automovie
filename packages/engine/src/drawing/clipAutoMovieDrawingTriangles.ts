import { IAutoMovieDrawingFrame, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { AUTOMOVIE_DRAWING_EPSILON } from "./AUTOMOVIE_DRAWING_EPSILON";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { autoMovieDrawingPlaneDistance } from "./autoMovieDrawingPlaneDistance";

/**
 * Keep only the part of a triangle soup on the far side of the cut plane.
 *
 * Sutherland-Hodgman on each triangle, re-fanned into triangles. The new faces
 * lying in the plane are exactly the ones the cut linework already draws, and
 * the caller drops their silhouette so no segment is drafted twice.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Removes viewer-side material from a cutting view so projected outlines describe only geometry beyond the section plane.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Clips each facet against the far half-space, inserts plane crossings, and re-fans the surviving polygon deterministically.
 */
export const clipAutoMovieDrawingTriangles = (
  frame: IAutoMovieDrawingFrame,
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingTriangle[] => {
  const kept: IAutoMovieDrawingTriangle[] = [];
  for (const triangle of triangles) {
    const polygon: IAutoMovieVector3[] = [];
    const corners = [triangle.a, triangle.b, triangle.c];
    for (let index = 0; index < 3; ++index) {
      const current = corners[index]!;
      const next = corners[(index + 1) % 3]!;
      const da = autoMovieDrawingPlaneDistance(frame, current);
      const db = autoMovieDrawingPlaneDistance(frame, next);
      if (da <= AUTOMOVIE_DRAWING_EPSILON) polygon.push(current);
      if (da * db < 0)
        polygon.push(Vector3.lerp(current, next, da / (da - db)));
    }
    for (let index = 1; index + 1 < polygon.length; ++index)
      kept.push({
        a: polygon[0]!,
        b: polygon[index]!,
        c: polygon[index + 1]!,
      });
  }
  return kept;
};
