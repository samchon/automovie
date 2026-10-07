import type { IAutoMovieVector3 } from "@automovie/interface";

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
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Gives source deformation and attachment registration one barycentric interpolation owner without moving the established source seat.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves triangle identity through bounded represented coefficient admission and unchanged weighted-coordinate arithmetic.
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
      (p) =>
        p !== undefined && p !== null && [p.x, p.y, p.z].every(Number.isFinite),
    ) ||
    !Array.from(weights).every((w) => Number.isFinite(w) && w >= 0)
  )
    throw new Error(
      "Triangle seating requires three finite points and nonnegative finite weights.",
    );
  let low = 0,
    high = 0;
  for (const weight of weights) {
    low = outward(low + weight, false);
    high = outward(high + weight, true);
  }
  if (low > 1 || high < 1)
    throw new Error(
      "Triangle seating weights need a represented unit-sum enclosure.",
    );
  const point = points.reduce(
    (sum, p, at) => Vector3.add(sum, Vector3.scale(p, weights[at])),
    Vector3.create(),
  );
  if (![point.x, point.y, point.z].every(Number.isFinite))
    throw new Error(
      "Triangle seating requires representable weighted coordinates.",
    );
  return point;
}
