import { AutoMovieMonotone } from "./AutoMovieMonotone";

/**
 * Build a shape-preserving piecewise cubic interpolant through knots, the
 * Fritsch-Carlson scheme.
 *
 * Between two knots the curve is a cubic Hermite segment whose end slopes are
 * set so that it stays monotone: it never leaves the range of the two knot
 * values it joins, so a profile that rises and falls has its maximum at a knot
 * and invents no bulge or dip between distant knots, which a plain cubic spline
 * or Catmull-Rom curve does. Slopes follow Fritsch and Carlson (1980, SIAM J.
 * Numer. Anal. 17(2):238-246): each interior slope starts as the mean of the
 * secants on its two sides, or zero where they differ in sign or either is
 * zero (a local extremum or a flat run); each segment whose slope ratios
 * `alpha = m_k / d_k` and `beta = m_{k+1} / d_k` leave the circle of radius 3
 * has both slopes scaled back onto it. The result is C1.
 *
 * Open knots extrapolate flat: below the first knot the curve holds the first
 * value and above the last it holds the last. An open curve's end slopes are
 * the adjacent secants, limited by the same rule. Periodic knots wrap: `period`
 * is the length after which the curve repeats, every knot lies in
 * `[0, period)`, and the segment from the last knot to the first plus one
 * period closes the loop with slopes taken across the wrap.
 *
 * A single knot gives a constant curve. Knots must be finite and strictly
 * increasing, with one value per knot.
 *
 * @param props.knots Abscissae, finite and strictly increasing.
 * @param props.values Ordinates, one per knot, finite.
 * @param props.period Repeat length of a periodic curve; omitted, the curve is open.
 * @returns The interpolant, which evaluates in constant time after a binary search over the knots.
 * @throws Error when the knots are empty, unsorted or not finite, the values do not match them, or a period does not exceed the knot span.
 *
 * @evidence contracts/common.md#principled-implementation Fritsch and Carlson's monotone piecewise cubic Hermite interpolation: zero slopes at sign changes and the radius-3 restriction are the published sufficient condition for each segment to stay monotone, so values never overshoot their neighbouring knots; the periodic form applies the same rule to secants taken across the wrap.
 * @evidence contracts/common.md#clear-and-simple-design Validation and a closure over `AutoMovieMonotone`, which owns slope selection and evaluation for this and every in-place caller; the sweep's stations, guides and scale, and periodic section radii, all call it rather than each carrying its own spline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsorted or duplicate knots are refused instead of sorted or merged, and extrapolation holds end values instead of extending a cubic beyond the data.
 * @evidence contracts/common.md#meaningful-documentation States the overshoot guarantee, the slope rule and its source, continuity, open extrapolation, periodic wrapping and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms O(n) to compute the n slopes once; each evaluation is one O(log n) binary search and a cubic, with no allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The returned closure is the reuse: callers build it once per profile and evaluate it many times.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains copies of the knots, values and slopes, O(n), released with the closure.
 */
export const interpolateAutoMovieMonotone: (props: {
  knots: readonly number[];
  values: readonly number[];
  period?: number;
}) => (x: number) => number = (props: {
  knots: readonly number[];
  values: readonly number[];
  period?: number;
}): ((x: number) => number) => {
  const n: number = props.knots.length;
  if (n === 0) throw new Error("monotone interpolation needs at least one knot");
  if (props.values.length !== n)
    throw new Error("monotone interpolation needs one value per knot");
  const xs: number[] = [...props.knots];
  const ys: number[] = [...props.values];
  for (let k: number = 0; k < n; ++k) {
    if (!Number.isFinite(xs[k]!) || !Number.isFinite(ys[k]!))
      throw new Error(`monotone interpolation knot ${k} is not finite`);
    if (k > 0 && !(xs[k]! > xs[k - 1]!))
      throw new Error(`monotone interpolation knot ${k} does not increase`);
  }
  const period: number | undefined = props.period;
  if (period !== undefined) {
    if (!Number.isFinite(period) || xs[0]! < 0 || !(xs[n - 1]! < period))
      throw new Error("periodic knots must lie in [0, period)");
  }
  const slopes: Float64Array = new Float64Array(n);
  const width: number = period ?? 0;
  AutoMovieMonotone.slope(xs, ys, n, width, slopes);
  return (x: number): number => AutoMovieMonotone.evaluate(xs, ys, slopes, n, width, x);
};
