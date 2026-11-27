import type { IAutoMovieProfilePoint } from "@automovie/interface";

import { AutoMovieEnginePlanarArea } from "../AutoMovieEnginePlanarArea";

/*
 * Signed area enclosed by a closed planar ring, positive when the ring runs
 * counter-clockwise in its `x, y` plane.
 *
 * The last point joins back to the first. Coordinates are metres, so the result
 * is square metres; a self-crossing ring returns the net of its oppositely
 * wound lobes, and fewer than three points return zero.
 * Parameter points: Ring corners in order.
 * Returns: Signed area in square metres.
 */
export const signedArea: (
  points: readonly IAutoMovieProfilePoint[],
) => number = (points: readonly IAutoMovieProfilePoint[]): number =>
  AutoMovieEnginePlanarArea.measure(points);
