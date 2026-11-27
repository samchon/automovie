import type { IAutoMovieInterpolateMonotone } from "@automovie/interface";

import { AutoMovieEngineMonotone } from "../../AutoMovieEngineMonotone";

/*
 * Build a shape-preserving piecewise cubic interpolant through knots, the
 * Fritsch-Carlson scheme.
 *
 * Between two knots the curve is a cubic Hermite segment whose end slopes are
 * set so that it stays monotone: it never leaves the range of the two knot
 * values it joins, so a profile that rises and falls has its maximum at a knot
 * and invents no bulge or dip between distant knots, which a plain cubic spline
 * or Catmull-Rom curve does. Slopes follow Fritsch and Carlson (1980, SIAM J.
 * Numer. Anal. 17(2):238-246): each interior slope starts as the mean of the
 * secants on its two sides, or zero where they differ in sign or either is zero
 * (a local extremum or a flat run); each segment whose slope ratios `alpha =
 * m_k / d_k` and `beta = m_{k+1} / d_k` leave the circle of radius 3 has both
 * slopes scaled back onto it. The result is C1.
 *
 * Open knots extrapolate flat: below the first knot the curve holds the first
 * value and above the last it holds the last. An open curve's end slopes are
 * the adjacent secants, limited by the same rule. Periodic knots wrap: `period`
 * is the length after which the curve repeats, every knot lies in `[0,
 * period)`, and the segment from the last knot to the first plus one period
 * closes the loop with slopes taken across the wrap.
 *
 * A single knot gives a constant curve. Knots must be finite and strictly
 * increasing, with one value per knot.
 * Parameter props.knots: Abscissae, finite and strictly increasing.
 * Parameter props.values: Ordinates, one per knot, finite.
 * Parameter props.period: Repeat length of a periodic curve; omitted, the curve is
 * open.
 * Returns: The interpolant, which evaluates in constant time after a binary
 * search over the knots.
 * Error when the knots are empty, unsorted or not finite, the values do
 * not match them, or a period does not exceed the knot span.
 */
export const interpolateMonotone: (
  props: IAutoMovieInterpolateMonotone.IProps,
) => (x: number) => number = (
  props: IAutoMovieInterpolateMonotone.IProps,
): ((x: number) => number) => {
  const n: number = props.knots.length;
  if (n === 0)
    throw new Error("monotone interpolation needs at least one knot");
  if (props.values.length !== n)
    throw new Error("monotone interpolation needs one value per knot");
  const xs: number[] = [...props.knots];
  const ys: number[] = [...props.values];
  for (let k: number = 0; k < n; ++k) {
    if (k > 0 && !(xs[k]! > xs[k - 1]!))
      throw new Error(`monotone interpolation knot ${k} does not increase`);
  }
  const period: number | undefined = props.period;
  if (period !== undefined) {
    if (xs[0]! < 0 || !(xs[n - 1]! < period))
      throw new Error("periodic knots must lie in [0, period)");
  }
  const slopes: Float64Array = new Float64Array(n);
  const width: number = period ?? 0;
  AutoMovieEngineMonotone.slope(xs, ys, n, width, slopes);
  return (x: number): number =>
    AutoMovieEngineMonotone.evaluate(xs, ys, slopes, n, width, x);
};
