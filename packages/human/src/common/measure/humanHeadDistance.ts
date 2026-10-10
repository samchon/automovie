import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The straight distance between two head points, in metres, as a caliper
 * reads it.
 *
 * @author Samchon
 */
export function humanHeadDistance(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
