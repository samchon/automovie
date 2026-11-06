/**
 * Natural cubic spline through knots: the C2 curve of least bending that
 * passes through every knot, with zero curvature at both ends.
 *
 * It carries a sparse anatomical law along a chain: a few stations hold the
 * named numbers and the spline evaluates them at any layer, so layers can be
 * as dense as the surface needs while the independent numbers stay few.
 *
 * @evidence contracts/common.md#principled-implementation The natural cubic spline is the C2 interpolant of least bending, with zero end curvature, so a few named values carry a whole curve.
 * @evidence contracts/common.md#clear-and-simple-design One prepared record serves value-only, derivative-only and combined readers through the same polynomial owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Beyond the ends the reader explicitly chooses straight end-tangent extension rather than clamping; zero endpoint curvature alone does not define exterior behavior.
 * @evidence contracts/common.md#meaningful-documentation States the end condition, the extrapolation and the derivatives returned.
 * @evidence contracts/performance.md#efficient-algorithms The tridiagonal solve is O(N); each query locates its interval in O(log N), and read shares that lookup across value and derivatives.
 * @evidence contracts/performance.md#reuse-equivalent-work Knot curvatures are solved once and reused by every evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the knots and one curvature array.
 */
export namespace AutoMovieNaturalSpline {
  /**
   * A spline prepared for evaluation; knot arrays are borrowed and must remain unchanged.
   *
   * @evidence contracts/common.md#principled-implementation Knot values and solved second derivatives represent the natural cubic on strictly increasing abscissae.
   * @evidence contracts/common.md#clear-and-simple-design Three arrays expose the interpolation data without a separate evaluator object.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural record carries no validation or immutability guarantee; matching finite arrays remain producer premises.
   * @evidence contracts/common.md#meaningful-documentation Names the borrowed knots, values and owned curvature array, including their mutation restriction.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record chooses no algorithm; create solves and the reading functions locate intervals.
   * @evidence contracts/performance.md#reuse-equivalent-work Every reading shares these solved curvatures while the referenced knot/value arrays stay unchanged.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Its owner retains two borrowed arrays and one O(N) curvature array until it releases the record; no module cache extends that lifetime.
   */
  export interface ISpline {
    /** Strictly increasing knot abscissae. */
    xs: readonly number[];

    /** Knot values. */
    ys: readonly number[];

    /** Second derivative at every knot. */
    curvatures: number[];
  }

  /**
   * Solve the tridiagonal system of the knot curvatures.
   *
   * @param xs Strictly increasing knots, at least two.
   * @param ys One value per knot.
   *
   * @evidence contracts/common.md#principled-implementation Thomas elimination solves the natural cubic's tridiagonal curvature equations, with zero endpoint curvatures; finite increasing knots and matching values are required by callers.
   * @evidence contracts/common.md#clear-and-simple-design Preparation returns the original knot/value arrays with one solved curvature array for both readers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not merge repeated knots or clamp values; it performs no independent admission, so zero gaps and ill-scaled arithmetic are outside its stated premise.
   * @evidence contracts/common.md#meaningful-documentation Gives the knot order/count premise, natural end condition and borrowed-array ownership through ISpline.
   * @evidence contracts/performance.md#efficient-algorithms A forward elimination and back substitution use O(N) time and O(N) temporary/output storage instead of a dense solve.
   * @evidence contracts/performance.md#reuse-equivalent-work Computes curvatures once for all later readings of the returned spline; no key-based sharing or mutation invalidation is attempted.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Diagonal, upper and right arrays are call-local; the returned record retains the input arrays and curvature array for its owner's lifetime.
   */
  export function create(
    xs: readonly number[],
    ys: readonly number[],
  ): ISpline {
    const n: number = xs.length;
    const diagonal: number[] = new Array<number>(n).fill(1);
    const upper: number[] = new Array<number>(n).fill(0);
    const right: number[] = new Array<number>(n).fill(0);
    for (let i: number = 1; i + 1 < n; i++) {
      const h0: number = xs[i]! - xs[i - 1]!;
      const h1: number = xs[i + 1]! - xs[i]!;
      const m: number = h0 / diagonal[i - 1]!;
      diagonal[i] = 2 * (h0 + h1) - m * upper[i - 1]!;
      upper[i] = h1;
      right[i] =
        6 * ((ys[i + 1]! - ys[i]!) / h1 - (ys[i]! - ys[i - 1]!) / h0) -
        m * right[i - 1]!;
    }
    const curvatures: number[] = new Array<number>(n).fill(0);
    for (let i: number = n - 2; i >= 1; i--)
      curvatures[i] =
        (right[i]! - upper[i]! * curvatures[i + 1]!) / diagonal[i]!;
    return { xs, ys, curvatures };
  }

  /**
   * Value at x; beyond the end knots the curve continues as its straight
   * end tangent by this reader's explicit extension rule.
   *
   * @evidence contracts/common.md#principled-implementation Reads the cubic determined by adjacent values and curvatures, and explicitly extends the first/last tangent outside the knot range.
   * @evidence contracts/common.md#clear-and-simple-design One lower-bound interval lookup and the shared value polynomial serve interpolation and both tangent extensions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Extrapolation is a declared linear extension, not a claim that the boundary cubic stays linear outside its interval; inputs are not clamped.
   * @evidence contracts/common.md#meaningful-documentation States the outside-range rule; ISpline specifies increasing unchanged knots and matching prepared curvatures.
   * @evidence contracts/performance.md#efficient-algorithms Binary lookup is O(log N), followed by constant scalar arithmetic; value-only queries allocate no derivative tuple or search index.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the prepared knot curvatures and reads only one interval's coefficients; repeated query locations are not cached.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a scalar and retains no input, buffer or handle.
   */
  export function evaluate(spline: ISpline, x: number): number {
    const k: number = interval(spline.xs, x);
    return valueAt(spline, x, k);
  }

  /** Same polynomial and tangent arithmetic at an already selected span. */
  function valueAt(spline: ISpline, x: number, k: number): number {
    const { xs, ys, curvatures }: ISpline = spline;
    const h: number = xs[k + 1]! - xs[k]!;
    const t: number = x - xs[k]!;
    const slope: number =
      (ys[k + 1]! - ys[k]!) / h -
      (h * (2 * curvatures[k]! + curvatures[k + 1]!)) / 6;
    if (t < 0) return ys[k]! + t * slope;
    if (t > h) {
      const end: number =
        slope +
        h * curvatures[k]! +
        (h * (curvatures[k + 1]! - curvatures[k]!)) / 2;
      return ys[k + 1]! + (t - h) * end;
    }
    return (
      ys[k]! +
      t *
        (slope +
          t *
            (curvatures[k]! / 2 +
              (t * (curvatures[k + 1]! - curvatures[k]!)) / (6 * h)))
    );
  }

  /**
   * First and second derivatives at x of the same piecewise cubic as
   * {@link evaluate}: on an interval `S' = slope + M_k t + (M_{k+1} - M_k) t^2 / (2 h)`
   * and `S'' = M_k + (M_{k+1} - M_k) t / h`; beyond the end knots the straight
   * end tangent, with no curvature.
   *
   * @param spline The spline.
   * @param x Abscissa.
   * @returns `[S'(x), S''(x)]`.
   *
   * @evidence contracts/common.md#principled-implementation Analytically differentiates the same natural cubic as evaluate; the explicit tangent extension has its endpoint slope and zero second derivative.
   * @evidence contracts/common.md#clear-and-simple-design Returns the two derivative orders together after one interval lookup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses exact polynomial derivatives rather than finite differences; the local parameter clamp implements the documented exterior tangent.
   * @evidence contracts/common.md#meaningful-documentation Gives derivative formulas, tuple order and the outside-knot behavior.
   * @evidence contracts/performance.md#efficient-algorithms One O(log N) lower-bound lookup precedes constant arithmetic and a fresh derivative pair.
   * @evidence contracts/performance.md#reuse-equivalent-work Both derivatives share the interval width, local parameter, secant and prepared curvatures.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the fresh two-number result escapes; the spline is not mutated or retained.
   */
  export function derivative(spline: ISpline, x: number): [number, number] {
    const k: number = interval(spline.xs, x);
    return derivativeAt(spline, x, k);
  }

  /** Same derivative and exterior arithmetic at an already selected span. */
  function derivativeAt(
    spline: ISpline,
    x: number,
    k: number,
  ): [number, number] {
    const { xs, ys, curvatures }: ISpline = spline;
    const n: number = xs.length;
    const h: number = xs[k + 1]! - xs[k]!;
    const t: number = Math.min(h, Math.max(0, x - xs[k]!));
    const slope: number =
      (ys[k + 1]! - ys[k]!) / h -
      (h * (2 * curvatures[k]! + curvatures[k + 1]!)) / 6;
    const inside: boolean = x >= xs[0]! && x <= xs[n - 1]!;
    return [
      slope +
        curvatures[k]! * t +
        ((curvatures[k + 1]! - curvatures[k]!) * t * t) / (2 * h),
      inside
        ? curvatures[k]! + ((curvatures[k + 1]! - curvatures[k]!) * t) / h
        : 0,
    ];
  }

  /**
   * Value and first/second derivatives with one shared interval lookup.
   *
   * @evidence contracts/common.md#principled-implementation Uses the same value and derivative polynomial owners after a lower-bound search on admitted increasing knots.
   * @evidence contracts/common.md#clear-and-simple-design A combined query serves Outline.at while scalar evaluate remains value-only.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact-knot left ties, NaN's last interval and straight exterior tangents retain their existing arithmetic; no cursor or clamp is added.
   * @evidence contracts/common.md#meaningful-documentation Returns [value,first,second] in the selected parameter; borrowed spline arrays must remain unchanged.
   * @evidence contracts/performance.md#efficient-algorithms One O(log N) lookup and constant polynomial work replace two linear scans.
   * @evidence contracts/performance.md#reuse-equivalent-work Both existing polynomial readers share the selected span without caching query history.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A fresh three-number tuple and local derivative pair are call-owned; nothing is retained.
   */
  export function read(spline: ISpline, x: number): [number, number, number] {
    const k: number = interval(spline.xs, x);
    const value: number = valueAt(spline, x, k);
    const jet: [number, number] = derivativeAt(spline, x, k);
    return [value, jet[0], jet[1]];
  }

  /** First span whose right knot is >=x; failed comparisons retain the old last-span NaN policy. */
  function interval(xs: readonly number[], x: number): number {
    let lo: number = 0;
    let hi: number = xs.length - 2;
    while (lo < hi) {
      const middle: number = lo + Math.floor((hi - lo) / 2);
      if (x <= xs[middle + 1]!) hi = middle;
      else lo = middle + 1;
    }
    return lo;
  }
}
