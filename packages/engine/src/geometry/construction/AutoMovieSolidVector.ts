/**
 * The vector algebra the solid operators share: world vectors in millimetres
 * as fixed triples, and the 3 by 3 and 2 by 2 linear solves their Newton steps
 * take.
 *
 * Every function returns a fresh triple and reads its arguments only, so a
 * caller may pass the same triple twice. The solves use Cramer's rule, exact
 * for the well-conditioned systems the operators build and cheap for their
 * size; each reports a singular system by returning null, and the caller
 * decides what a singular system means (a tangential contact, a degenerate
 * chart), so no solve guesses past it.
 *
 * @evidence contracts/common.md#principled-implementation The three-vector algebra and small linear solves the operators share, with pivoting and a relative singularity test.
 * @evidence contracts/common.md#clear-and-simple-design Plain functions on tuples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A singular system returns null rather than a regularised answer.
 * @evidence contracts/common.md#meaningful-documentation States each operation and the singularity tests.
 * @evidence contracts/performance.md#efficient-algorithms Constant work per call; the general solve is Gaussian elimination with partial pivoting.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers keep the returned tuples instead of recomputing them.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fresh tuples and holds nothing.
 */
export namespace AutoMovieSolidVector {
  /** A world point or direction, mm. */
  export type Vec3 = [number, number, number];

  /**
   * The sum of two vectors.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a + b`.
   */
  export function add(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /**
   * The difference of two vectors.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a - b`.
   */
  export function sub(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /**
   * A vector times a scalar.
   *
   * @param a The vector.
   * @param k The scalar.
   * @returns `k a`.
   */
  export function scale(a: Readonly<Vec3>, k: number): Vec3 {
    return [a[0] * k, a[1] * k, a[2] * k];
  }

  /**
   * A weighted sum of vectors, `sum_i k_i a_i`.
   *
   * @param terms Pairs of weight and vector.
   * @returns The sum; the zero vector for no terms.
   */
  export function combine(terms: readonly (readonly [number, Readonly<Vec3>])[]): Vec3 {
    const out: Vec3 = [0, 0, 0];
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
  export function dot(a: Readonly<Vec3>, b: Readonly<Vec3>): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * The cross product.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a x b`.
   */
  export function cross(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /**
   * The Euclidean length.
   *
   * @param a The vector.
   * @returns `|a|`.
   */
  export function norm(a: Readonly<Vec3>): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /**
   * The unit vector along a vector.
   *
   * @param a The vector.
   * @returns `a / |a|`, or null for the zero vector.
   */
  export function unit(a: Readonly<Vec3>): Vec3 | null {
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
   * @returns `x`, or null when the determinant is under `1e-14` of the
   *   product of the columns' lengths (the columns nearly coplanar).
   */
  export function solve3(c0: Readonly<Vec3>, c1: Readonly<Vec3>, c2: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 | null {
    const det: number = dot(c0, cross(c1, c2));
    const size: number = norm(c0) * norm(c1) * norm(c2);
    if (!(Math.abs(det) > 1e-14 * size)) return null;
    return [dot(b, cross(c1, c2)) / det, dot(c0, cross(b, c2)) / det, dot(c0, cross(c1, b)) / det];
  }

  /**
   * The solution of the symmetric or general 2 by 2 system
   * `[[a, b], [c, d]] x = r` by Cramer's rule.
   *
   * @param a Row 1, column 1.
   * @param b Row 1, column 2.
   * @param c Row 2, column 1.
   * @param d Row 2, column 2.
   * @param r Right-hand side.
   * @returns `x`, or null when the determinant is under `1e-14` of
   *   `|a d| + |b c|`.
   */
  export function solve2(a: number, b: number, c: number, d: number, r: readonly [number, number]): [number, number] | null {
    const det: number = a * d - b * c;
    if (!(Math.abs(det) > 1e-14 * (Math.abs(a * d) + Math.abs(b * c)))) return null;
    return [(r[0] * d - b * r[1]) / det, (a * r[1] - c * r[0]) / det];
  }

  /**
   * The solution of a square system `M x = b` by Gaussian elimination with
   * partial pivoting, for the 4 by 4 systems of a curve traced by a declared
   * parameter.
   *
   * @param rows The matrix by rows, square; not modified.
   * @param b Right-hand side.
   * @returns `x`, or null when a pivot falls under `1e-14` of the largest
   *   entry of the matrix (the rows nearly dependent).
   */
  export function solve(rows: readonly (readonly number[])[], b: readonly number[]): number[] | null {
    const n: number = rows.length;
    const m: number[][] = rows.map((r: readonly number[], i: number): number[] => [...r, b[i]!]);
    let largest: number = 0;
    for (const r of rows) for (const x of r) largest = Math.max(largest, Math.abs(x));
    for (let c: number = 0; c < n; c++) {
      let p: number = c;
      for (let r: number = c + 1; r < n; r++) if (Math.abs(m[r]![c]!) > Math.abs(m[p]![c]!)) p = r;
      if (!(Math.abs(m[p]![c]!) > 1e-14 * largest)) return null;
      [m[c], m[p]] = [m[p]!, m[c]!];
      for (let r: number = c + 1; r < n; r++) {
        const f: number = m[r]![c]! / m[c]![c]!;
        for (let k: number = c; k <= n; k++) m[r]![k]! -= f * m[c]![k]!;
      }
    }
    const x: number[] = new Array<number>(n).fill(0);
    for (let r: number = n - 1; r >= 0; r--) {
      let sum: number = m[r]![n]!;
      for (let k: number = r + 1; k < n; k++) sum -= m[r]![k]! * x[k]!;
      x[r] = sum / m[r]![r]!;
    }
    return x;
  }
}
