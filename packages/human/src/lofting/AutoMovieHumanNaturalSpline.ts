/**
 * Natural cubic spline through knots: the C2 curve of least bending that
 * passes through every knot, with zero curvature at both ends.
 *
 * It carries a sparse anatomical law along a chain: a few stations hold the
 * named numbers and the spline evaluates them at any layer, so layers can be
 * as dense as the surface needs while the independent numbers stay few.
 */
export namespace AutoMovieHumanNaturalSpline {
  /** A spline prepared for evaluation. */
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
   * end tangent, because a natural spline has no curvature there.
   */
  export function evaluate(spline: ISpline, x: number): number {
    const { xs, ys, curvatures } = spline;
    const n: number = xs.length;
    let k: number = n - 2;
    for (let i: number = 0; i + 1 < n; i++)
      if (x <= xs[i + 1]!) {
        k = i;
        break;
      }
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
          t * (curvatures[k]! / 2 + (t * (curvatures[k + 1]! - curvatures[k]!)) / (6 * h)))
    );
  }
}
