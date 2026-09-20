import { IAutoMovieDrawingPoint } from "@automovie/interface";

/**
 * Signed doubled-area shoelace magnitude, halved: the area of a simple polygon.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Measures the area enclosed by a derived page polygon directly from its ordered drawing coordinates.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Returns half the absolute shoelace sum for three or more vertices and zero for a non-polygonal input.
 */
export const autoMovieDrawingPolygonArea = (
  polygon: readonly IAutoMovieDrawingPoint[],
): number => {
  if (polygon.length < 3) return 0;
  let sum = 0;
  for (let index = 0; index < polygon.length; ++index) {
    const current = polygon[index]!;
    const next = polygon[(index + 1) % polygon.length]!;
    sum += current.x * next.y - next.x * current.y;
  }
  return Math.abs(sum) / 2;
};
