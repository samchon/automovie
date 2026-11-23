import { IAutoMovieVector3 } from "@automovie/interface";

import { closestPointsBetweenSegments } from "./closestPointsBetweenSegments";

/**
 * Closest horizontal point on the closed start/end segment, with returned Y
 * zero. Exact coincident endpoints remain a point; every nonzero span remains a
 * segment. Coordinates share one metre frame. The shared segment query's finite
 * arithmetic admission and binary64 witness precision apply after height is
 * discarded.
 */
export const closestPointOnSegmentXZ: (
  point: Pick<IAutoMovieVector3, "x" | "z">,
  start: Pick<IAutoMovieVector3, "x" | "z">,
  end: Pick<IAutoMovieVector3, "x" | "z">,
) => IAutoMovieVector3 = (
  point: Pick<IAutoMovieVector3, "x" | "z">,
  start: Pick<IAutoMovieVector3, "x" | "z">,
  end: Pick<IAutoMovieVector3, "x" | "z">,
): IAutoMovieVector3 => {
  const query: IAutoMovieVector3 = { x: point.x, y: 0, z: point.z };
  return closestPointsBetweenSegments(
    query,
    query,
    { x: start.x, y: 0, z: start.z },
    { x: end.x, y: 0, z: end.z },
  ).pointB;
};
