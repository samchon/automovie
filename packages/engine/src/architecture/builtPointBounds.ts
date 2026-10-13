import { IAutoMovieSubjectBox, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The smallest axis-aligned box containing every given point, or null when
 * there is none.
 *
 * The corners are folded one point at a time rather than spread into
 * `Math.min`, so a list of any length, such as every vertex a space states,
 * returns a box instead of throwing a `RangeError` for too many call
 * arguments. A `NaN` coordinate propagates into the result. The box is new and
 * shares no object with the points.
 *
 * @evidence contracts/common.md#principled-implementation The axis-aligned box of a point set is the per-axis minimum and maximum of its coordinates, computed by a left fold whose `Math.min` and `Math.max` are exact, so point order cannot change the answer.
 * @evidence contracts/common.md#clear-and-simple-design One fold shared by the population, opening-sweep and space-volume bounds, which each kept a private copy; the empty list answers null so a caller can tell "no points" from a point box.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Treats every point alike and caps no list length; the spread argument limit is removed by folding rather than caught.
 * @evidence contracts/common.md#meaningful-documentation States the null for an empty list, that any length is accepted, the `NaN` propagation, and that the result is a fresh box.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the points with constant extra space and one allocated box.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure fold over the given list that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the one returned box.
 */
export const builtPointBounds: (points: readonly IAutoMovieVector3[]) => IAutoMovieSubjectBox | null = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieSubjectBox | null => {
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
};
