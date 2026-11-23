import type { AutoMovieVector3Tuple } from "@automovie/interface";

import { prepareLinearSystem } from "../../math/prepareLinearSystem";

/**
 * The vector algebra the solid operators share: world vectors in millimetres as
 * fixed triples, and the 3 by 3 and 2 by 2 linear solves their Newton steps
 * take.
 *
 * Inputs are read without mutation; vector results are fresh tuples. The fixed
 * 2 by 2 and 3 by 3 solves use Cramer's rule, and the general solve uses
 * partial-pivot Gaussian elimination. Their relative rejection tests identify
 * numerically small determinants or pivots, not exact rank or a certified error
 * bound. Callers supply finite, consistently scaled values whose intermediate
 * products remain representable, and decide what a null solve means for the
 * contact or chart they are constructing.
 */
export namespace AutoMovieSolidVector {
  /**
   * The sum of two vectors.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a + b`.
   */
  export function add(
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
  ): AutoMovieVector3Tuple {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /**
   * The difference of two vectors.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a - b`.
   */
  export function sub(
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
  ): AutoMovieVector3Tuple {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /**
   * A vector times a scalar.
   *
   * @param a The vector.
   * @param k The scalar.
   * @returns `k a`.
   */
  export function scale(
    a: Readonly<AutoMovieVector3Tuple>,
    k: number,
  ): AutoMovieVector3Tuple {
    return [a[0] * k, a[1] * k, a[2] * k];
  }

  /**
   * A weighted sum of vectors, `sum_i k_i a_i`.
   *
   * @param terms Pairs of weight and vector.
   * @returns The sum; the zero vector for no terms.
   */
  export function combine(
    terms: readonly (readonly [number, Readonly<AutoMovieVector3Tuple>])[],
  ): AutoMovieVector3Tuple {
    const out: AutoMovieVector3Tuple = [0, 0, 0];
    for (const [k, a] of terms) {
      out[0] += k * a[0];
      out[1] += k * a[1];
      out[2] += k * a[2];
    }
    return out;
  }

  /**
   * The dot product.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a . b`.
   */
  export function dot(
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
  ): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * The cross product.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a x b`.
   */
  export function cross(
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
  ): AutoMovieVector3Tuple {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /**
   * The Euclidean length.
   *
   * @param a The vector.
   * @returns `|a|`.
   */
  export function norm(a: Readonly<AutoMovieVector3Tuple>): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /**
   * The unit vector along a vector.
   *
   * @param a The vector. The unit-length result requires a finite representable
   *   positive norm; this routine does not apply max-component scaling for
   *   extreme inputs.
   * @returns `a / |a|` when the computed norm is positive, otherwise null.
   */
  export function unit(
    a: Readonly<AutoMovieVector3Tuple>,
  ): AutoMovieVector3Tuple | null {
    const l: number = norm(a);
    return l > 0 ? [a[0] / l, a[1] / l, a[2] / l] : null;
  }

  /**
   * The solution of `[c0 c1 c2] x = b`, the matrix given by its columns, by
   * Cramer's rule.
   *
   * @param c0 First column.
   * @param c1 Second column.
   * @param c2 Third column.
   * @param b Right-hand side.
   * @returns `x`, or null when the determinant is under `1e-14` of the product
   *   of the columns' lengths (the columns nearly coplanar).
   */
  export function solve3(
    c0: Readonly<AutoMovieVector3Tuple>,
    c1: Readonly<AutoMovieVector3Tuple>,
    c2: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
  ): AutoMovieVector3Tuple | null {
    const det: number = dot(c0, cross(c1, c2));
    const size: number = norm(c0) * norm(c1) * norm(c2);
    if (!(Math.abs(det) > 1e-14 * size)) return null;
    return [
      dot(b, cross(c1, c2)) / det,
      dot(c0, cross(b, c2)) / det,
      dot(c0, cross(c1, b)) / det,
    ];
  }

  /**
   * The solution of the symmetric or general 2 by 2 system `[[a, b], [c, d]] x
   * = r` by Cramer's rule.
   *
   * @param a Row 1, column 1.
   * @param b Row 1, column 2.
   * @param c Row 2, column 1.
   * @param d Row 2, column 2.
   * @param r Right-hand side.
   * @returns `x`, or null when the determinant is under `1e-14` of `|a d| + |b
   *   c|`.
   */
  export function solve2(
    a: number,
    b: number,
    c: number,
    d: number,
    r: readonly [number, number],
  ): [number, number] | null {
    const det: number = a * d - b * c;
    if (!(Math.abs(det) > 1e-14 * (Math.abs(a * d) + Math.abs(b * c))))
      return null;
    return [(r[0] * d - b * r[1]) / det, (a * r[1] - c * r[0]) / det];
  }

  /**
   * The solution of a square system `M x = b` by Gaussian elimination with
   * partial pivoting, for the 4 by 4 systems of a curve traced by a declared
   * parameter.
   *
   * @param rows The matrix by rows, square; not modified.
   * @param b Right-hand side.
   * @returns `x`, or null when a pivot falls under `1e-14` of the largest entry
   *   of the matrix (the rows nearly dependent).
   */
  export function solve(
    rows: readonly (readonly number[])[],
    b: readonly number[],
  ): number[] | null {
    return prepareLinearSystem.solve(rows, b);
  }
}
