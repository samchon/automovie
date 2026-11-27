import type { IAutoMovieNaturalCubicSpline } from "@automovie/interface";

import { AutoMoviePeriodicCubic } from "./AutoMoviePeriodicCubic";

/**
 * Natural cubic spline through knots: the C2 curve of least bending that passes
 * through every knot, with zero curvature at both ends.
 *
 * It carries a sparse anatomical law along a chain: a few stations hold the
 * named numbers and the spline evaluates them at any layer, so layers can be as
 * dense as the surface needs while the independent numbers stay few.
 */
export namespace AutoMovieNaturalSpline {
  /**
   * Solve the tridiagonal system of the knot curvatures.
   *
   * @param xs Strictly increasing knots, at least two.
   * @param ys One value per knot.
   */
  export function create(
    xs: readonly number[],
    ys: readonly number[],
  ): IAutoMovieNaturalCubicSpline {
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
   * Value at x; beyond the end knots the curve continues as its straight end
   * tangent by this reader's explicit extension rule.
   */
  export function evaluate(
    spline: IAutoMovieNaturalCubicSpline,
    x: number,
  ): number {
    const k: number = interval(spline.xs, x);
    return valueAt(spline, x, k);
  }

  /**
   * First and second derivatives at x of the same piecewise cubic as
   * {@link evaluate}: on an interval `S' = slope + M_k t + (M_{k+1} - M_k) t^2 /
   * (2 h)` and `S'' = M_k + (M_{k+1} - M_k) t / h`; beyond the end knots the
   * straight end tangent, with no curvature.
   *
   * @param spline The spline.
   * @param x Abscissa.
   * @returns `[S'(x), S''(x)]`.
   */
  export function derivative(
    spline: IAutoMovieNaturalCubicSpline,
    x: number,
  ): [number, number] {
    const k: number = interval(spline.xs, x);
    return derivativeAt(spline, x, k);
  }

  /** Value and first/second derivatives with one shared interval lookup. */
  export function read(
    spline: IAutoMovieNaturalCubicSpline,
    x: number,
  ): [number, number, number] {
    const k: number = interval(spline.xs, x);
    const value: number = valueAt(spline, x, k);
    const jet: [number, number] = derivativeAt(spline, x, k);
    return [value, jet[0], jet[1]];
  }

  /**
   * Third derivative at x of the same piecewise cubic as {@link evaluate}:
   * constant `(M_{k+1} - M_k) / h` on the interval {@link derivative} reads,
   * zero beyond the end knots.
   *
   * @param spline The spline.
   * @param x Abscissa.
   * @returns `S^(3)(x)`.
   */
  export function jerk(
    spline: IAutoMovieNaturalCubicSpline,
    x: number,
  ): number {
    const { xs, curvatures }: IAutoMovieNaturalCubicSpline = spline;
    const n: number = xs.length;
    if (!(x >= xs[0]! && x <= xs[n - 1]!)) return 0;
    const k: number = interval(xs, x);
    return (curvatures[k + 1]! - curvatures[k]!) / (xs[k + 1]! - xs[k]!);
  }

  /**
   * The periodic cubic spline through values at the equally spaced phases `2 pi
   * j / m`: the C2 periodic curve of least bending through them, read at any
   * phase.
   *
   * Its knot curvatures `M` solve `M[j-1] + 4 M[j] + M[j+1] = 6 (y[j+1] - 2
   * y[j] + y[j-1]) / h^2` round the cycle, `h = 2 pi / m`. The system is
   * strictly diagonally dominant, so Jacobi's iteration contracts the error by
   * at least one half a sweep; 64 sweeps leave less than `2^-64` of the first
   * one.
   *
   * @param values The values at the `m >= 3` phases.
   * @returns The spline as a function of phase, radians, any real.
   */
  export function periodic(values: readonly number[]): (psi: number) => number {
    return AutoMoviePeriodicCubic.create(values).at;
  }

  /*
   * Same polynomial and tangent arithmetic at an already selected span.
   */
  function valueAt(
    spline: IAutoMovieNaturalCubicSpline,
    x: number,
    k: number,
  ): number {
    const { xs, ys, curvatures }: IAutoMovieNaturalCubicSpline = spline;
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

  /*
   * Same derivative and exterior arithmetic at an already selected span.
   */
  function derivativeAt(
    spline: IAutoMovieNaturalCubicSpline,
    x: number,
    k: number,
  ): [number, number] {
    const { xs, ys, curvatures }: IAutoMovieNaturalCubicSpline = spline;
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

  /*
   * First span whose right knot is >=x; failed comparisons retain the old
   * last-span NaN policy.
   */
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
