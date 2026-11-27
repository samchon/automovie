import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { ObservationGeometry } from "./ObservationGeometry";

/*
 * The area-weighted centroid of a closed planar outline, or the mean of its
 * points when the outline encloses no area.
 *
 * The outline is read as a simple polygon closing from its last point back to
 * its first, in either winding. When the absolute doubled signed area is at
 * most ObservationGeometry.Epsilon, including a sufficiently small
 * nonzero area, the vertex mean is returned instead. An empty outline answers
 * `NaN` coordinates.
 */
export function outlineCentroid(
  outline: readonly IAutoMoviePlanarPoint[],
): IAutoMoviePlanarPoint {
  let doubleArea: number = 0;
  let x: number = 0;
  let y: number = 0;
  for (let index: number = 0; index < outline.length; index++) {
    const from: IAutoMoviePlanarPoint = outline[index]!;
    const to: IAutoMoviePlanarPoint = outline[(index + 1) % outline.length]!;
    const cross: number = from.x * to.y - to.x * from.y;
    doubleArea += cross;
    x += (from.x + to.x) * cross;
    y += (from.y + to.y) * cross;
  }
  if (Math.abs(doubleArea) > ObservationGeometry.Epsilon)
    return { x: x / (3 * doubleArea), y: y / (3 * doubleArea) };
  let sumX: number = 0;
  let sumY: number = 0;
  for (const point of outline) {
    sumX += point.x;
    sumY += point.y;
  }
  return { x: sumX / outline.length, y: sumY / outline.length };
}
