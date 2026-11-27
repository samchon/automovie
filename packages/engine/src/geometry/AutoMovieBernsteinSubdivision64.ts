import type {
  AutoMovieBernsteinPolynomial64,
  AutoMovieVector3Tuple,
} from "@automovie/interface";

import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";

/**
 * Exact De Casteljau subdivision of Bernstein coefficient arrays: splitting at
 * one parameter, restricting to an ordered subinterval and partitioning into
 * three consecutive parameter thirds, for vector and scalar polynomials.
 *
 * Every operation preserves the algebraic polynomial on each child domain
 * before floating-point rounding; none samples, fits or reduces degree. Callers
 * own parameter-domain admission beyond the stated ordered-interval check.
 */
export namespace AutoMovieBernsteinSubdivision64 {
  /**
   * Split a nonempty vector polynomial, preserving exact endpoint restrictions
   * at t=0 and t=1.
   */
  export function split(
    c: readonly AutoMovieVector3Tuple[],
    t: number,
  ): [AutoMovieBernsteinPolynomial64, AutoMovieBernsteinPolynomial64] {
    if (t === 0)
      return [
        c.map((): AutoMovieVector3Tuple => V.clone(c[0]!)),
        c.map(V.clone),
      ];
    if (t === 1)
      return [
        c.map(V.clone),
        c.map((): AutoMovieVector3Tuple => V.clone(c.at(-1)!)),
      ];
    let row: AutoMovieBernsteinPolynomial64 = c.map(V.clone);
    const a: AutoMovieBernsteinPolynomial64 = [V.clone(row[0]!)],
      b: AutoMovieBernsteinPolynomial64 = [V.clone(row.at(-1)!)];
    while (row.length > 1) {
      row = row
        .slice(0, -1)
        .map(
          (p: AutoMovieVector3Tuple, i: number): AutoMovieVector3Tuple =>
            V.mix(p, row[i + 1]!, t),
        );
      a.push(V.clone(row[0]!));
      b.push(V.clone(row.at(-1)!));
    }
    return [a, b.reverse()];
  }
  /** Split a scalar polynomial using the same De Casteljau restriction. */
  export function splitS(
    c: readonly number[],
    t: number,
  ): [number[], number[]] {
    const out: [
      AutoMovieBernsteinPolynomial64,
      AutoMovieBernsteinPolynomial64,
    ] = split(
      c.map((x: number): AutoMovieVector3Tuple => [x, 0, 0]),
      t,
    );
    return out.map((p: AutoMovieBernsteinPolynomial64): number[] =>
      p.map((x: AutoMovieVector3Tuple): number => x[0]),
    ) as [number[], number[]];
  }
  /**
   * Return the exact algebraic restriction to ordered local endpoints inside
   * [0,1].
   */
  export function restrict(
    c: readonly AutoMovieVector3Tuple[],
    a: number,
    b: number,
  ): AutoMovieBernsteinPolynomial64 {
    if (!(0 <= a && a < b && b <= 1))
      throw new Error("A restriction must lie in its original chart");
    const left: AutoMovieBernsteinPolynomial64 =
      b === 1 ? c.map(V.clone) : split(c, b)[0];
    return a === 0 ? left : split(left, a / b)[1];
  }
  /**
   * Restrict scalar coefficients while preserving their original chart
   * authority.
   */
  export function restrictS(
    c: readonly number[],
    a: number,
    b: number,
  ): number[] {
    return restrict(
      c.map((x: number): AutoMovieVector3Tuple => [x, 0, 0]),
      a,
      b,
    ).map((p: AutoMovieVector3Tuple): number => p[0]);
  }
  /** Partition one vector course into three exact consecutive restrictions. */
  export function thirds(
    c: readonly AutoMovieVector3Tuple[],
  ): AutoMovieBernsteinPolynomial64[] {
    const first: [
        AutoMovieBernsteinPolynomial64,
        AutoMovieBernsteinPolynomial64,
      ] = split(c, 1 / 3),
      rest: [AutoMovieBernsteinPolynomial64, AutoMovieBernsteinPolynomial64] =
        split(first[1], 0.5);
    return [first[0], ...rest];
  }
  /** Partition one scalar course into three exact consecutive restrictions. */
  export function thirdsS(c: readonly number[]): number[][] {
    return thirds(c.map((x: number): AutoMovieVector3Tuple => [x, 0, 0])).map(
      (p: AutoMovieBernsteinPolynomial64): number[] =>
        p.map((v: AutoMovieVector3Tuple): number => v[0]),
    );
  }
}
