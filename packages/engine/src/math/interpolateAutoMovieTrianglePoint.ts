import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "./Vector3";
import { adjacentAutoMovieFloat64 as outward } from "./adjacentAutoMovieFloat64";

/**
 * A represented triangle seat from three admitted barycentric coefficients. The
 * coefficient sum's outward addition enclosure must contain one; negative,
 * nonfinite or wrong-sized inputs refuse. Producer coefficients round, so exact
 * rational equality is not required. Coefficients are not renormalized: the
 * established three multiply/add source seat remains bit-identical. Attachment
 * registration accounts for its represented departure from the ideal plane.
 * Current geometry and seating consume the same multiplication order. Points
 * and weights remain caller-owned and the returned metre vector is owned.
 */
export function interpolateAutoMovieTrianglePoint(
  points: readonly IAutoMovieVector3[],
  weights: readonly number[],
): IAutoMovieVector3 {
  if (
    points.length !== 3 ||
    weights.length !== 3 ||
    weights.some((w: number): boolean => w < 0)
  )
    throw new Error(
      "Triangle seating requires three points and nonnegative weights.",
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
    (
      sum: IAutoMovieVector3,
      p: IAutoMovieVector3,
      at: number,
    ): IAutoMovieVector3 => Vector3.add(sum, Vector3.scale(p, weights[at])),
    Vector3.create(),
  );
  return point;
}
