import { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "./Vector3";
import { adjacentAutoMovieFloat64 as outward } from "./adjacentAutoMovieFloat64";
/**
 * A represented triangle seat from three admitted barycentric coefficients.
 * The coefficient sum's outward addition enclosure must contain one; negative,
 * nonfinite or wrong-sized inputs refuse. Producer coefficients round, so exact
 * rational equality is not required. Coefficients are not renormalized: the
 * established three multiply/add source seat remains bit-identical. Attachment
 * registration accounts for its represented departure from the ideal plane.
 * Current geometry and seating consume the same multiplication order. Points
 * and weights remain caller-owned and the returned metre vector is owned.
 *
 * @evidence contracts/common.md#principled-implementation Outward additions enclose the sum of three nonnegative weights and require inclusion of one; ordered weighted coordinates preserve represented seating, with finite result admission.
 * @evidence contracts/common.md#clear-and-simple-design Attachment registration and current geometry share one triangle-seating arithmetic owner; represented plane departure belongs to the attachment proof.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Weights are neither renormalized nor accepted by arbitrary sum epsilon; malformed arrays and nonrepresentable coordinates refuse.
 * @evidence contracts/common.md#meaningful-documentation Documents finite nonnegative weights, unit-sum enclosure, unchanged arithmetic order, owned metre point and ideal-plane limitation.
 * @evidence contracts/performance.md#efficient-algorithms Three point checks, three outward additions and three vector accumulations take constant work and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The enclosure is admitted once before coordinate accumulation; changed points or weights invalidate any previous seat.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Weighted vectors are bounded by three corners, and the returned point retains no input array reference.
 * @author Samchon
 */
export function interpolateAutoMovieTrianglePoint(
  points: readonly IAutoMovieVector3[],
  weights: readonly number[],
): IAutoMovieVector3 {
  if (
    points.length !== 3 ||
    weights.length !== 3 ||
    !Array.from(points).every(
      (p: IAutoMovieVector3): boolean =>
        p !== undefined && p !== null && [p.x, p.y, p.z].every(Number.isFinite),
    ) ||
    !Array.from(weights).every((w: number): boolean => Number.isFinite(w) && w >= 0)
  )
    throw new Error(
      "Triangle seating requires three finite points and nonnegative finite weights.",
    );
  let low: number = 0,
    high: number = 0;
  for (const weight of weights) {
    low = outward(low + weight, false);
    high = outward(high + weight, true);
  }
  if (low > 1 || high < 1)
    throw new Error(
      "Triangle seating weights need a represented unit-sum enclosure.",
    );
  const point: IAutoMovieVector3 = points.reduce(
    (sum: IAutoMovieVector3, p: IAutoMovieVector3, at: number): IAutoMovieVector3 => Vector3.add(sum, Vector3.scale(p, weights[at])),
    Vector3.create(),
  );
  if (![point.x, point.y, point.z].every(Number.isFinite))
    throw new Error(
      "Triangle seating requires representable weighted coordinates.",
    );
  return point;
}
