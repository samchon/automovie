import type { IAutoMovieProfilePoint } from "@automovie/interface";

/**
 * Signed area enclosed by a closed planar ring, positive when the ring runs
 * counter-clockwise in its `x, y` plane.
 *
 * The last point joins back to the first. Coordinates are metres, so the result
 * is square metres; a self-crossing ring returns the net of its oppositely
 * wound lobes, and fewer than three points return zero.
 *
 * @param points Ring corners in order.
 * @returns Signed area in square metres.
 */
export const signedArea: (
  points: readonly IAutoMovieProfilePoint[],
) => number = (points: readonly IAutoMovieProfilePoint[]): number => {
  let total: number = 0;
  for (let index: number = 0; index < points.length; ++index) {
    const from: IAutoMovieProfilePoint = points[index]!;
    const to: IAutoMovieProfilePoint = points[(index + 1) % points.length]!;
    total += from.x * to.y - to.x * from.y;
  }
  return total / 2;
};
