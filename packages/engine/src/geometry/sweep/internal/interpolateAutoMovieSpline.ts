import type { IAutoMovieInterpolateSpline } from "@automovie/interface";

import { AutoMovieSpline } from "../../AutoMovieSpline";

/**
 * Build a C2 interpolant through knots with a sampled overshoot policy: the
 * spline under tension of `AutoMovieSpline`, at tension 0 a cubic spline and
 * with a searched tension whose sixteen-part segment scan stays within a tenth
 * of the largest value step within two segments. This is a sampled policy, not
 * a strict bound on extrema; the fixed maximum tension can be returned without
 * scan acceptance. Positive data can produce negative interpolation.
 *
 * It passes through its knots with continuous curvature at interior knots.
 * Constant extension outside open knots need not preserve the endpoint
 * derivative. Radius and scale consumers must refuse invalid query results.
 * Open knots extend flat: below the first knot the curve holds the first value
 * and above the last it holds the last, with second derivative 0 at both ends.
 * Periodic knots wrap: `period` is the length after which the curve repeats and
 * every knot lies in `[0, period)`. One knot gives a constant, two open knots a
 * straight segment.
 *
 * @param props.knots Abscissae, finite and strictly increasing.
 * @param props.values Ordinates, one per knot, finite.
 * @param props.period Repeat length of a periodic curve; omitted, the curve is
 *   open.
 * @returns The interpolant, which evaluates after a binary search over the
 *   knots.
 * @throws Error when the knots are empty, unsorted or not finite, the values do
 *   not match them, or a period does not exceed the knot span.
 */
export const interpolateAutoMovieSpline: (
  props: IAutoMovieInterpolateSpline.IProps,
) => (x: number) => number = (
  props: IAutoMovieInterpolateSpline.IProps,
): ((x: number) => number) => {
  const n: number = props.knots.length;
  if (n === 0) throw new Error("spline interpolation needs at least one knot");
  if (props.values.length !== n)
    throw new Error("spline interpolation needs one value per knot");
  const xs: Float64Array = Float64Array.from(props.knots);
  const ys: Float64Array = Float64Array.from(props.values);
  for (let k: number = 0; k < n; ++k) {
    if (k > 0 && !(xs[k]! > xs[k - 1]!))
      throw new Error(`spline interpolation knot ${k} does not increase`);
  }
  const period: number = props.period ?? 0;
  if (props.period !== undefined && (xs[0]! < 0 || !(xs[n - 1]! < period)))
    throw new Error("periodic knots must lie in [0, period)");
  const m: Float64Array = new Float64Array(n);
  const tension: number = AutoMovieSpline.fit(
    xs,
    ys,
    n,
    period,
    m,
    new Float64Array(7 * n + 17),
  );
  return (x: number): number =>
    AutoMovieSpline.evaluate(xs, ys, m, n, period, tension, x);
};
