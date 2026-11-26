import { IAutoMovieSubjectBox, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The smallest axis-aligned box containing every given point, or null when
 * there is none.
 *
 * The corners are folded one point at a time rather than spread into
 * `Math.min`, so a list of any length, such as every vertex a space states,
 * returns a box instead of throwing a `RangeError` for too many call arguments.
 * A `NaN` coordinate propagates into the result. The box is new and shares no
 * object with the points.
 */
export function builtPointBounds(
  points: readonly IAutoMovieVector3[],
): IAutoMovieSubjectBox | null {
  const first: IAutoMovieVector3 | undefined = points[0];
  if (first === undefined) return null;
  const min: IAutoMovieVector3 = { ...first };
  const max: IAutoMovieVector3 = { ...first };
  for (const point of points) {
    min.x = Math.min(min.x, point.x);
    min.y = Math.min(min.y, point.y);
    min.z = Math.min(min.z, point.z);
    max.x = Math.max(max.x, point.x);
    max.y = Math.max(max.y, point.y);
    max.z = Math.max(max.z, point.z);
  }
  return { min, max };
}
