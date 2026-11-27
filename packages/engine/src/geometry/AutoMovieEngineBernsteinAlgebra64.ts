import type {
  AutoMovieBernsteinPolynomial64,
  AutoMovieVector3Tuple,
} from "@automovie/interface";

import { AutoMovieEngineCurveMath64 as V } from "./AutoMovieEngineCurveMath64";

/**
 * Bernstein coefficient algebra in binary64 with explicit degree. Coefficient
 * arrays are nonempty and corresponding finite values unless a member states a
 * different case; callers own degree/index admission, parameter domains and
 * representable intermediate arithmetic. Construction does not certify a
 * regular curve or positive rational denominator.
 *
 * Degree elevation, multiplication, addition and differentiation preserve the
 * algebraic polynomial before floating-point rounding; no sampled fit or cubic
 * replacement is used. This internal algebra is shared by subdivision,
 * longitudinal grids and the legacy public facade without circular
 * initialization.
 */
export namespace AutoMovieEngineBernsteinAlgebra64 {
  /**
   * Return a binomial coefficient for integer indices 0<=k<=n; callers own
   * finite representability of the multiplicative factors.
   */
  export function choose(n: number, k: number): number {
    let v: number = 1;
    for (let i: number = 1; i <= k; i++) v *= (n - i + 1) / i;
    return v;
  }
  /**
   * Evaluate scalar Bernstein coefficients, preserving supplied coefficients at
   * t=0 and t=1.
   */
  export function scalar(c: readonly number[], t: number): number {
    if (t === 0) return c[0]!;
    if (t === 1) return c.at(-1)!;
    if (c.length === 1) return c[0]!;
    if (c.length === 2) {
      const first: number = c[0]!,
        second: number = c[1]!;
      return first + t * (second - first);
    }
    if (c.length === 3 || c.length === 4) {
      let first: number = c[0]!,
        second: number = c[1]!,
        third: number = c[2]!;
      if (c.length === 4) {
        const fourth: number = c[3]!;
        first = first + t * (second - first);
        second = second + t * (third - second);
        third = third + t * (fourth - third);
      }
      first = first + t * (second - first);
      second = second + t * (third - second);
      return first + t * (second - first);
    }
    const row: number[] = [...c];
    for (let length: number = row.length; length > 1; length--)
      for (let i: number = 0; i + 1 < length; i++)
        row[i] = row[i]! + t * (row[i + 1]! - row[i]!);
    return row[0]!;
  }
  /**
   * Evaluate nonempty vector Bernstein coefficients with copied exact
   * endpoints.
   */
  export function value(
    c: readonly AutoMovieVector3Tuple[],
    t: number,
  ): AutoMovieVector3Tuple {
    if (t === 0) return V.clone(c[0]!);
    if (t === 1) return V.clone(c.at(-1)!);
    let row: AutoMovieVector3Tuple[] = c.map(V.clone);
    while (row.length > 1)
      row = row
        .slice(0, -1)
        .map(
          (a: AutoMovieVector3Tuple, i: number): AutoMovieVector3Tuple =>
            V.mix(a, row[i + 1]!, t),
        );
    return row[0]!;
  }
  /**
   * Differentiate vector coefficients and apply the caller chart-scale factor.
   * A constant produces an empty vector coefficient array; evaluating that
   * array is outside value()'s nonempty-input contract.
   */
  export function tangent(
    c: readonly AutoMovieVector3Tuple[],
    scale: number = 1,
  ): AutoMovieBernsteinPolynomial64 {
    return c
      .slice(1)
      .map(
        (p: AutoMovieVector3Tuple, i: number): AutoMovieVector3Tuple =>
          V.scale(V.sub(p, c[i]!), (c.length - 1) * scale),
      );
  }
  /** Differentiate scalar coefficients; a constant returns the zero constant. */
  export function dScalar(c: readonly number[], scale: number = 1): number[] {
    return c.length === 1
      ? [0]
      : c
          .slice(1)
          .map(
            (p: number, i: number): number =>
              (p - c[i]!) * (c.length - 1) * scale,
          );
  }
  /**
   * Raise scalar degree without changing its polynomial; a requested reduction
   * rejects.
   */
  export function elevateScalar(
    c: readonly number[],
    degree: number,
  ): number[] {
    if (degree < c.length - 1)
      throw new Error("Degree reduction is not an elevation");
    let out: number[] = [...c];
    while (out.length <= degree) {
      const n: number = out.length;
      out = Array.from({ length: n + 1 }, (_: unknown, i: number): number =>
        i === 0
          ? out[0]!
          : i === n
            ? out[n - 1]!
            : (i / n) * out[i - 1]! + (1 - i / n) * out[i]!,
      );
    }
    return out;
  }
  /** Raise each vector coordinate to one common Bernstein degree. */
  export function elevate(
    c: readonly AutoMovieVector3Tuple[],
    degree: number,
  ): AutoMovieBernsteinPolynomial64 {
    const axes: number[][] = [0, 1, 2].map((k: number): number[] =>
      elevateScalar(
        c.map((p: AutoMovieVector3Tuple): number => p[k]!),
        degree,
      ),
    );
    return axes[0]!.map(
      (_: number, i: number): AutoMovieVector3Tuple =>
        axes.map((a: number[]): number => a[i]!) as AutoMovieVector3Tuple,
    );
  }
  /** Multiply scalar Bernstein polynomials using binomial-weighted convolution. */
  export function product(
    a: readonly number[],
    b: readonly number[],
  ): number[] {
    const m: number = a.length - 1,
      n: number = b.length - 1;
    return Array.from(
      { length: m + n + 1 },
      (_: unknown, k: number): number => {
        let sum: number = 0;
        for (let i: number = Math.max(0, k - n); i <= Math.min(m, k); i++)
          sum +=
            ((choose(m, i) * choose(n, k - i)) / choose(m + n, k)) *
            a[i]! *
            b[k - i]!;
        return sum;
      },
    );
  }
  /** Multiply each vector coordinate by a scalar Bernstein polynomial. */
  export function productV(
    a: readonly number[],
    b: readonly AutoMovieVector3Tuple[],
  ): AutoMovieBernsteinPolynomial64 {
    const axes: number[][] = [0, 1, 2].map((k: number): number[] =>
      product(
        a,
        b.map((p: AutoMovieVector3Tuple): number => p[k]!),
      ),
    );
    return axes[0]!.map(
      (_: number, i: number): AutoMovieVector3Tuple =>
        axes.map((p: number[]): number => p[i]!) as AutoMovieVector3Tuple,
    );
  }
  /** Elevate to a common degree, then add the scaled vector polynomial. */
  export function add(
    a: readonly AutoMovieVector3Tuple[],
    b: readonly AutoMovieVector3Tuple[],
    factor: number = 1,
  ): AutoMovieBernsteinPolynomial64 {
    const degree: number = Math.max(a.length, b.length) - 1,
      x: AutoMovieBernsteinPolynomial64 = elevate(a, degree),
      y: AutoMovieBernsteinPolynomial64 = elevate(b, degree);
    return x.map(
      (p: AutoMovieVector3Tuple, i: number): AutoMovieVector3Tuple =>
        V.add(p, V.scale(y[i]!, factor)),
    );
  }
  /** Elevate to a common degree, then add the scaled scalar polynomial. */
  export function addS(
    a: readonly number[],
    b: readonly number[],
    factor: number = 1,
  ): number[] {
    const degree: number = Math.max(a.length, b.length) - 1,
      x: number[] = elevateScalar(a, degree),
      y: number[] = elevateScalar(b, degree);
    return x.map((p: number, i: number): number => p + factor * y[i]!);
  }
  /**
   * Multiply every vector coefficient by the same scalar without changing
   * degree.
   */
  export function scale(
    a: readonly AutoMovieVector3Tuple[],
    factor: number,
  ): AutoMovieBernsteinPolynomial64 {
    return a.map(
      (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple => V.scale(p, factor),
    );
  }
}
