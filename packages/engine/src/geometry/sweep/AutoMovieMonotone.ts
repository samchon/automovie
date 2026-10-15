/**
 * The Fritsch-Carlson monotone cubic on caller-owned arrays: slopes computed
 * in place and evaluation without allocation, so a profile whose values
 * change every frame, such as a posed sweep's volume scale, is rebuilt into
 * the same buffers.
 *
 * `interpolateAutoMovieMonotone` validates its knots and wraps these two
 * functions in a closure; callers that already hold validated knots call them
 * directly. A `period` of 0 means an open curve.
 *
 * @evidence contracts/common.md#principled-implementation Fritsch and Carlson's monotone piecewise cubic Hermite interpolation (1980, SIAM J. Numer. Anal. 17(2):238-246), split into its slope step and its Hermite evaluation.
 * @evidence contracts/common.md#clear-and-simple-design The one implementation of the scheme: the closure API and every in-place caller share these two functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inputs are not validated here; the only producers are `interpolateAutoMovieMonotone`, which validates, and compiled profiles whose knots were validated when compiled.
 * @evidence contracts/common.md#meaningful-documentation States the split, the period convention and who validates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A namespace; costs are on its members.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A namespace; its members are the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A namespace retaining nothing.
 */
export namespace AutoMovieMonotone {
  /**
   * Write the slope at each of `n` knots.
   *
   * Each interior slope starts as the mean of its two secants, or zero where
   * they differ in sign or either is zero; a segment whose slope ratios leave
   * the circle of radius 3 has both scaled back onto it; an open curve's end
   * slopes are its end secants. A periodic curve takes secants across the
   * wrap. One knot gives slope 0.
   *
   * @param xs Strictly increasing knots, at least `n`.
   * @param ys Values, at least `n`.
   * @param n Number of knots used.
   * @param period Repeat length, or 0 for an open curve.
   * @param slopes Output, at least `n`.
   *
   * @evidence contracts/common.md#principled-implementation The published sufficient condition for monotone Hermite segments: zero slopes at sign changes and the radius-3 restriction.
   * @evidence contracts/common.md#clear-and-simple-design One pass for the initial slopes and one for the restriction, reading secants on demand so no secant array is needed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No smoothing beyond the published rule.
   * @evidence contracts/common.md#meaningful-documentation States the rule, the ends, the wrap and the arrays.
   * @evidence contracts/performance.md#efficient-algorithms O(n) with no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per profile change; the slopes are the reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing and writes only `slopes`.
   */
  export const slope = (
    xs: ArrayLike<number>,
    ys: ArrayLike<number>,
    n: number,
    period: number,
    slopes: { [index: number]: number },
  ): void => {
    if (n < 2) {
      if (n === 1) slopes[0] = 0;
      return;
    }
    const segments: number = period === 0 ? n - 1 : n;
    for (let k: number = 0; k < n; ++k) {
      const before: number =
        k > 0
          ? secant(xs, ys, n, period, k - 1)
          : period !== 0
            ? secant(xs, ys, n, period, segments - 1)
            : NaN;
      const after: number = k < segments ? secant(xs, ys, n, period, k) : NaN;
      if (Number.isNaN(before)) slopes[k] = after;
      else if (Number.isNaN(after)) slopes[k] = before;
      else slopes[k] = before * after <= 0 ? 0 : (before + after) / 2;
    }
    for (let k: number = 0; k < segments; ++k) {
      const l: number = (k + 1) % n;
      const d: number = secant(xs, ys, n, period, k);
      if (d === 0) {
        slopes[k] = 0;
        slopes[l] = 0;
        continue;
      }
      const alpha: number = slopes[k]! / d;
      const beta: number = slopes[l]! / d;
      // an end slope against its secant would leave the segment's range
      if (alpha < 0) slopes[k] = 0;
      if (beta < 0) slopes[l] = 0;
      const radius: number = Math.hypot(Math.max(0, alpha), Math.max(0, beta));
      if (radius > 3) {
        const tau: number = 3 / radius;
        slopes[k] = tau * Math.max(0, alpha) * d;
        slopes[l] = tau * Math.max(0, beta) * d;
      }
    }
  };

  /**
   * Evaluate the curve at `x`.
   *
   * An open curve holds its end values outside its knots; a periodic curve
   * wraps `x` into one period from the first knot. Between knots it is the
   * cubic Hermite segment of the two knots' values and slopes.
   *
   * @param xs Knots, as given to `slope`.
   * @param ys Values, as given to `slope`.
   * @param slopes Slopes from `slope`.
   * @param n Number of knots used.
   * @param period Repeat length, or 0 for an open curve.
   * @param input Abscissa.
   * @returns The value.
   *
   * @evidence contracts/common.md#principled-implementation The cubic Hermite basis on the segment that holds `x`, found by binary search, with flat extrapolation for open curves.
   * @evidence contracts/common.md#clear-and-simple-design One evaluation for every caller of the scheme.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No cubic is extended beyond the knots of an open curve.
   * @evidence contracts/common.md#meaningful-documentation States the extrapolation, the wrap and the segment rule.
   * @evidence contracts/performance.md#efficient-algorithms O(log n) binary search plus a cubic, with no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure evaluation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
   */
  export const evaluate = (
    xs: ArrayLike<number>,
    ys: ArrayLike<number>,
    slopes: ArrayLike<number>,
    n: number,
    period: number,
    input: number,
  ): number => {
    if (n === 1) return ys[0]!;
    const first: number = xs[0]!;
    const last: number = xs[n - 1]!;
    let x: number = input;
    if (period !== 0) x = ((((x - first) % period) + period) % period) + first;
    else {
      if (x <= first) return ys[0]!;
      if (x >= last) return ys[n - 1]!;
    }
    // the segment holding x: the last knot not above it, or the wrap segment
    let low: number = 0;
    let high: number = n - 1;
    if (x >= last) low = n - 1;
    else
      while (high - low > 1) {
        const middle: number = (low + high) >> 1;
        if (xs[middle]! <= x) low = middle;
        else high = middle;
      }
    const k: number = low;
    const l: number = (k + 1) % n;
    const h: number = width(xs, n, period, k);
    const t: number = (x - xs[k]!) / h;
    const t2: number = t * t;
    const t3: number = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[k]! +
      (t3 - 2 * t2 + t) * h * slopes[k]! +
      (-2 * t3 + 3 * t2) * ys[l]! +
      (t3 - t2) * h * slopes[l]!
    );
  };

  /** Width of segment `k`, the wrap segment's taken across the period. */
  const width = (
    xs: ArrayLike<number>,
    n: number,
    period: number,
    k: number,
  ): number => (k < n - 1 ? xs[k + 1]! - xs[k]! : xs[0]! + period - xs[n - 1]!);

  /** Secant of segment `k`. */
  const secant = (
    xs: ArrayLike<number>,
    ys: ArrayLike<number>,
    n: number,
    period: number,
    k: number,
  ): number => (ys[(k + 1) % n]! - ys[k]!) / width(xs, n, period, k);
}
