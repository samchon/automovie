/**
 * Natural cubic spline through knots: the C2 curve of least bending that
 * passes through every knot, with zero curvature at both ends.
 *
 * It carries a sparse anatomical law along a chain: a few stations hold the
 * named numbers and the spline evaluates them at any layer, so layers can be
 * as dense as the surface needs while the independent numbers stay few.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the end condition, the extrapolation and the derivatives returned.
 * @evidence contracts/development/design.md#principled-representation Represents Natural cubic spline through knots: the C2 curve of least bending that passes through every knot, with zero curvature at both ends: companion namespace of 9 members (`ISpline`, `create`, `evaluate`, `valueAt`, `derivative`, `derivativeAt`, ...); units and frames named in its text: second, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieNaturalSpline` in packages/engine/src/geometry/construction/AutoMovieNaturalSpline.ts; its surface is the 9 members listed and the text shows 31 other files naming it, mostly packages/human (24), packages/engine (6), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieNaturalSpline {
  /**
   * A spline prepared for evaluation; knot arrays are borrowed and must remain unchanged.
   *
   * @evidence contracts/development/design.md#principled-representation Knot values and solved second derivatives represent the natural cubic on strictly increasing abscissae.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three arrays expose the interpolation data without a separate evaluator object.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This structural record carries no validation or immutability guarantee; matching finite arrays remain producer premises.
   * @evidence contracts/development/common.md#meaningful-documentation Names the borrowed knots, values and owned curvature array, including their mutation restriction.
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
   * @evidence contracts/development/implementation.md#principled-implementation Thomas elimination solves the natural cubic's tridiagonal curvature equations, with zero endpoint curvatures; finite increasing knots and matching values are required by callers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation returns the original knot/value arrays with one solved curvature array for both readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not merge repeated knots or clamp values; it performs no independent admission, so zero gaps and ill-scaled arithmetic are outside its stated premise.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the knot order/count premise, natural end condition and borrowed-array ownership through ISpline.
   * @evidence contracts/development/implementation.md#efficient-algorithms A forward elimination and back substitution use O(N) time and O(N) temporary/output storage instead of a dense solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Computes curvatures once for all later readings of the returned spline; no key-based sharing or mutation invalidation is attempted.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Diagonal, upper and right arrays are call-local; the returned record retains the input arrays and curvature array for its owner's lifetime.
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
   * @evidence contracts/development/implementation.md#principled-implementation Reads the cubic determined by adjacent values and curvatures, and explicitly extends the first/last tangent outside the knot range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lower-bound interval lookup and the shared value polynomial serve interpolation and both tangent extensions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Extrapolation is a declared linear extension, not a claim that the boundary cubic stays linear outside its interval; inputs are not clamped.
   * @evidence contracts/development/common.md#meaningful-documentation States the outside-range rule; ISpline specifies increasing unchanged knots and matching prepared curvatures.
   * @evidence contracts/development/implementation.md#efficient-algorithms Binary lookup is O(log N), followed by constant scalar arithmetic; value-only queries allocate no derivative tuple or search index.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the prepared knot curvatures and reads only one interval's coefficients; repeated query locations are not cached.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains no input, buffer or handle.
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
   * @evidence contracts/development/implementation.md#principled-implementation Analytically differentiates the same natural cubic as evaluate; the explicit tangent extension has its endpoint slope and zero second derivative.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns the two derivative orders together after one interval lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses exact polynomial derivatives rather than finite differences; the local parameter clamp implements the documented exterior tangent.
   * @evidence contracts/development/common.md#meaningful-documentation Gives derivative formulas, tuple order and the outside-knot behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(log N) lower-bound lookup precedes constant arithmetic and a fresh derivative pair.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both derivatives share the interval width, local parameter, secant and prepared curvatures.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the fresh two-number result escapes; the spline is not mutated or retained.
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
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same value and derivative polynomial owners after a lower-bound search on admitted increasing knots.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A combined query serves Outline.at while scalar evaluate remains value-only.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact-knot left ties, NaN's last interval and straight exterior tangents retain their existing arithmetic; no cursor or clamp is added.
   * @evidence contracts/development/common.md#meaningful-documentation Returns [value,first,second] in the selected parameter; borrowed spline arrays must remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(log N) lookup and constant polynomial work replace two linear scans.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both existing polynomial readers share the selected span without caching query history.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A fresh three-number tuple and local derivative pair are call-owned; nothing is retained.
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

  /**
   * Third derivative at x of the same piecewise cubic as {@link evaluate}:
   * constant `(M_{k+1} - M_k) / h` on the interval {@link derivative} reads,
   * zero beyond the end knots.
   *
   * @param spline The spline.
   * @param x Abscissa.
   * @returns `S^(3)(x)`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Third derivative at x of the same piecewise cubic as {@link evaluate}: constant `(M_{k+1} - M_k) / h` on the interval {@link derivative} reads, zero beyond the end knots.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Third derivative at x of the same piecewise cubic as : constant `(M_{k+1} - M_k) / h` on the interval reads, zero beyond the end knots) directly over its typed inputs (`spline`, `x`) as a fixed number of statements with no loop or recursion in the body, delegating to `interval`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 7 lines and 5 top-level statements that reuses `interval` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 6 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `spline`, `x`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function jerk(spline: ISpline, x: number): number {
    const { xs, curvatures }: ISpline = spline;
    const n: number = xs.length;
    if (!(x >= xs[0]! && x <= xs[n - 1]!)) return 0;
    const k: number = interval(xs, x);
    return (curvatures[k + 1]! - curvatures[k]!) / (xs[k + 1]! - xs[k]!);
  }

  /**
   * The periodic cubic spline through values at the equally spaced phases `2 pi j / m`: the C2 periodic curve of least bending through
   * them, read at any phase.
   *
   * Its knot curvatures `M` solve `M[j-1] + 4 M[j] + M[j+1] = 6 (y[j+1] - 2 y[j] + y[j-1]) / h^2` round the cycle, `h = 2 pi / m`. The
   * system is strictly diagonally dominant, so Jacobi's iteration contracts the error by at least one half a sweep; 64 sweeps leave less
   * than `2^-64` of the first one.
   *
   * @param values The values at the `m >= 3` phases.
   * @returns The spline as a function of phase, radians, any real.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Solves the periodic cubic's cyclic curvature equations, the natural spline's with the cycle closed, and reads each span by the same polynomial as `evaluate`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed sweep count and one span reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The contraction bound fixes the sweep count; nothing is clamped and fewer than three values are the caller's premise.
   * @evidence contracts/development/common.md#meaningful-documentation States the equations, the solver's bound, the premise and the reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(64 m) to prepare and constant time a reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The curvatures are solved once and shared by every reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader retains the values and m curvatures only.
   */
  export function periodic(values: readonly number[]): (psi: number) => number {
    const m: number = values.length;
    const h: number = (2 * Math.PI) / m;
    const y = (j: number): number => values[((j % m) + m) % m]!;
    const right: number[] = values.map(
      (_: number, j: number): number =>
        (6 * (y(j + 1) - 2 * y(j) + y(j - 1))) / (h * h),
    );
    let M: number[] = new Array<number>(m).fill(0);
    for (let sweep: number = 0; sweep < 64; ++sweep)
      M = M.map(
        (_: number, j: number): number =>
          (right[j]! - M[(j - 1 + m) % m]! - M[(j + 1) % m]!) / 4,
      );
    return (psi: number): number => {
      const x: number =
        ((psi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const j: number = Math.min(m - 1, Math.floor(x / h));
      const t: number = x - j * h;
      const [a, b]: [number, number] = [M[j]!, M[(j + 1) % m]!];
      const slope: number = (y(j + 1) - y(j)) / h - (h * (2 * a + b)) / 6;
      return y(j) + t * (slope + t * (a / 2 + (t * (b - a)) / (6 * h)));
    };
  }
}
