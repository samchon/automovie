import { AutoMovieEnginePlanarArea } from "@automovie/engine";
import type { AutoMovieVector2Tuple } from "@automovie/interface";

/*
 * Measure a closed contour in its local XY plane using the Engine area
 * operation. Counter-clockwise contours are positive. Fewer than three corners
 * give zero.
 * Parameter points: Finite contour corners in a common frame and unit.
 * Returns: The signed area in squared input units.
 */
export function signedArea(points: AutoMovieVector2Tuple[]): number {
  return AutoMovieEnginePlanarArea.measureTuples(points);
}
