import {
  IAutoMoviePlanarPoint,
  type IAutoMoviePolygonBounds,
} from "@automovie/interface";

/**
 * The axis-aligned bounds of a polygon in its own planar frame.
 *
 * Returns componentwise extrema in polygon units as new caller-owned corners. A
 * meaningful finite box requires non-empty finite input. Empty input retains
 * `Infinity` minima and `-Infinity` maxima, and comparisons skip `NaN`
 * coordinates; this function does not validate either premise.
 *
 * @param polygon Points of the ring, in any order.
 * @returns The lower and upper corners of the bounding box.
 */
export function polygonBounds(
  polygon: readonly IAutoMoviePlanarPoint[],
): IAutoMoviePolygonBounds.IResult {
  const min: IAutoMoviePlanarPoint = { x: Infinity, y: Infinity };
  const max: IAutoMoviePlanarPoint = { x: -Infinity, y: -Infinity };
  for (const point of polygon) {
    if (point.x < min.x) min.x = point.x;
    if (point.y < min.y) min.y = point.y;
    if (point.x > max.x) max.x = point.x;
    if (point.y > max.y) max.y = point.y;
  }
  return { min, max };
}
