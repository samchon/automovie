import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * Twice the signed area of a closed polygon, positive when counter-clockwise.
 *
 * The polygon is an implicitly closed ring (the last point connects to the
 * first) in its own planar frame, so the result is in squared polygon units.
 * Counter-clockwise means with x right and y up. An empty polygon returns 0,
 * and a self-crossing one returns the net signed sum of its lobes.
 */
export const polygonDoubleArea = (
  polygon: readonly IAutoMoviePlanarPoint[],
): number => {
  let sum = 0;
  polygon.forEach((point, index) => {
    const next = polygon[(index + 1) % polygon.length]!;
    sum += point.x * next.y - next.x * point.y;
  });
  return sum;
};
