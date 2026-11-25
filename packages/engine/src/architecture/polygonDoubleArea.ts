import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * Twice the signed area of a closed polygon, positive when counter-clockwise.
 *
 * The ring closes from last to first in its planar frame; units are squared
 * polygon units and counter-clockwise uses x right, y up. Empty input returns
 * zero. In exact arithmetic the shoelace sum is twice signed area, or a
 * winding-weighted sum for self-crossings; this binary64 accumulation can
 * cancel or overflow, especially for small regions at large offsets.
 *
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns The shoelace sum, twice the signed enclosed area.
 */
export const polygonDoubleArea: (
  polygon: readonly IAutoMoviePlanarPoint[],
) => number = (polygon: readonly IAutoMoviePlanarPoint[]): number => {
  let sum: number = 0;
  for (let index: number = 0; index < polygon.length; ++index) {
    const point: IAutoMoviePlanarPoint = polygon[index]!;
    const next: IAutoMoviePlanarPoint = polygon[(index + 1) % polygon.length]!;
    sum += point.x * next.y - next.x * point.y;
  }
  return sum;
};
