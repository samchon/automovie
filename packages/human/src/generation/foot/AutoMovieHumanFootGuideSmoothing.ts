/**
 * A guide's knots smoothed to their own noise: the cubic smoothing spline of
 * the knots' in-plane places over their stations (Reinsch 1967), so a guide
 * follows the reference medians where they agree and averages them where
 * they scatter.
 *
 * Each region's knots are medians read one share of the stations at a time,
 * and the regions are read apart, so neighbouring knots carry scatter of
 * their own, crowd where two regions meet and fold where an extreme changes
 * branch. Interpolated exactly, all of it became the guide's shape. The
 * smoothing spline `g` minimises
 *
 * ```text
 * sum_i |y_i - g(t_i)|^2 + alpha * integral |g''(t)|^2 dt
 * ```
 *
 * whose solution is a natural cubic spline with knots at the stations:
 * `(R + alpha Q^T P Q) gamma = Q^T y`, `g = y - alpha P Q gamma`, with `Q`
 * the second-difference matrix of the stations, `R` the tridiagonal of the
 * spline's continuity (Green and Silverman 1994, 2.3) and `P` the inverse
 * weights, zero at the two end knots: a guide's ends are its seams with the
 * web ring and the ankle ring, so they stay where they stand. The weight `alpha` is
 * set by the discrepancy principle: the residual's sum of squares equals the
 * knots' count times their noise variance. The noise is read from the knots
 * themselves, as the robust spread (1.4826 times the median absolute value)
 * of each knot's distance from the chord of its two neighbours, normalised to
 * unit variance (Gasser, Sroka and Jennen-Steinmetz 1986), so a guide's own
 * bends, which few knots carry, do not count as noise.
 */
export namespace AutoMovieHumanFootGuideSmoothing {
  /**
   * The smoothed places at the knots.
   *
   * @param t Strictly increasing stations, at least three for any smoothing.
   * @param y Each knot's place, every one of the same dimension.
   * @returns The smoothing spline's values at the stations.
   */
  export function of(t: readonly number[], y: readonly (readonly number[])[]): number[][] {
    const n: number = t.length;
    const out: number[][] = y.map((p: readonly number[]): number[] => [...p]);
    if (n < 4) return out;
    const dims: number = y[0]!.length;

    // The pseudo-residuals: each inner knot off its neighbours' chord, scaled
    // to the noise's own variance.
    const spread: number[] = [];
    for (let i: number = 1; i < n - 1; i++) {
      const a: number = (t[i + 1]! - t[i]!) / (t[i + 1]! - t[i - 1]!);
      const b: number = 1 - a;
      const scale: number = Math.sqrt(1 + a * a + b * b);
      let sq: number = 0;
      for (let c: number = 0; c < dims; c++) sq += ((y[i]![c]! - a * y[i - 1]![c]! - b * y[i + 1]![c]!) / scale) ** 2;
      spread.push(Math.sqrt(sq / dims));
    }
    spread.sort((p: number, q: number): number => p - q);
    const median: number = spread[Math.floor(spread.length / 2)]!;
    const sigma: number = MAD * median;
    if (!(sigma > 0)) return out;
    const target: number = (n - 2) * dims * sigma * sigma;

    // The weight that meets the discrepancy, by bisection of its logarithm:
    // the residual grows with the weight.
    const h: number[] = Array.from({ length: n - 1 }, (_: unknown, i: number): number => t[i + 1]! - t[i]!);
    const residual = (alpha: number): number => {
      const g: number[][] = solve(h, y, alpha);
      let sum: number = 0;
      g.forEach((p: number[], i: number): void => {
        for (let c: number = 0; c < dims; c++) sum += (y[i]![c]! - p[c]!) ** 2;
      });
      return sum;
    };
    const span: number = t[n - 1]! - t[0]!;
    let lo: number = Math.log(WEIGHT_LEAST * span ** 3);
    let hi: number = Math.log(WEIGHT_MOST * span ** 3);
    if (residual(Math.exp(hi)) <= target) return solve(h, y, Math.exp(hi));
    for (let k: number = 0; k < BISECTIONS; k++) {
      const mid: number = 0.5 * (lo + hi);
      if (residual(Math.exp(mid)) < target) lo = mid;
      else hi = mid;
    }

    return solve(h, y, Math.exp(0.5 * (lo + hi)));
  }

  /**
   * The smoothing spline's values for one weight.
   *
   * @param h The station steps.
   * @param y The knots' places.
   * @param alpha The weight of the bending energy.
   */
  function solve(h: readonly number[], y: readonly (readonly number[])[], alpha: number): number[][] {
    const n: number = y.length;
    const m: number = n - 2;
    const dims: number = y[0]!.length;

    // Q (n by m): column j holds the second difference about knot j + 1.
    const q = (i: number, j: number): number => {
      if (i === j) return 1 / h[j]!;
      if (i === j + 1) return -1 / h[j]! - 1 / h[j + 1]!;
      if (i === j + 2) return 1 / h[j + 1]!;
      return 0;
    };

    // The inverse weights: the end knots are pinned.
    const free = (i: number): number => (i === 0 || i === n - 1 ? 0 : 1);

    // A = R + alpha Q^T P Q, banded of half width 2, written dense (m is a few dozen).
    const A: number[][] = Array.from({ length: m }, (): number[] => new Array<number>(m).fill(0));
    for (let j: number = 0; j < m; j++) {
      A[j]![j]! += (h[j]! + h[j + 1]!) / 3;
      if (j + 1 < m) {
        A[j]![j + 1]! += h[j + 1]! / 6;
        A[j + 1]![j]! += h[j + 1]! / 6;
      }
      for (let k: number = Math.max(0, j - 2); k <= Math.min(m - 1, j + 2); k++) {
        let s: number = 0;
        for (let i: number = Math.max(j, k); i <= Math.min(j, k) + 2; i++) s += free(i) * q(i, j) * q(i, k);
        A[j]![k]! += alpha * s;
      }
    }

    // Right sides Q^T y, one column per dimension.
    const B: number[][] = Array.from({ length: m }, (_: unknown, j: number): number[] =>
      Array.from({ length: dims }, (__: unknown, c: number): number => q(j, j) * y[j]![c]! + q(j + 1, j) * y[j + 1]![c]! + q(j + 2, j) * y[j + 2]![c]!),
    );
    const gamma: number[][] = gauss(A, B);

    // g = y - alpha P Q gamma.
    return y.map((p: readonly number[], i: number): number[] =>
      p.map((v: number, c: number): number => {
        let s: number = 0;
        for (let j: number = Math.max(0, i - 2); j <= Math.min(m - 1, i); j++) s += q(i, j) * gamma[j]![c]!;
        return v - alpha * free(i) * s;
      }),
    );
  }

  /**
   * Gaussian elimination with partial pivoting of a symmetric positive
   * definite system with several right sides.
   *
   * @param A The matrix, copied.
   * @param B The right sides, one row per equation, copied.
   */
  function gauss(A: readonly (readonly number[])[], B: readonly (readonly number[])[]): number[][] {
    const m: number = A.length;
    const a: number[][] = A.map((r: readonly number[]): number[] => [...r]);
    const b: number[][] = B.map((r: readonly number[]): number[] => [...r]);
    for (let k: number = 0; k < m; k++) {
      let p: number = k;
      for (let i: number = k + 1; i < m; i++) if (Math.abs(a[i]![k]!) > Math.abs(a[p]![k]!)) p = i;
      [a[k], a[p]] = [a[p]!, a[k]!];
      [b[k], b[p]] = [b[p]!, b[k]!];
      for (let i: number = k + 1; i < m; i++) {
        const f: number = a[i]![k]! / a[k]![k]!;
        if (f === 0) continue;
        for (let j: number = k; j < m; j++) a[i]![j]! -= f * a[k]![j]!;
        for (let c: number = 0; c < b[i]!.length; c++) b[i]![c]! -= f * b[k]![c]!;
      }
    }
    const x: number[][] = b.map((r: number[]): number[] => r.map((): number => 0));
    for (let k: number = m - 1; k >= 0; k--)
      for (let c: number = 0; c < x[k]!.length; c++) {
        let s: number = b[k]![c]!;
        for (let j: number = k + 1; j < m; j++) s -= a[k]![j]! * x[j]![c]!;
        x[k]![c] = s / a[k]![k]!;
      }
    return x;
  }
}

/** The median absolute deviation's factor to a normal standard deviation. */
const MAD: number = 1.4826;

/**
 * The weight's bracket over the cube of the stations' span: the bending
 * energy's weight has units of length cubed; at a billionth of the span
 * cubed the spline interpolates the knots and at a thousand times it the
 * spline is the line between the pinned ends, so the discrepancy's weight
 * lies between.
 */
const WEIGHT_LEAST: number = 1e-9;

/** The upper end of the weight's bracket over the stations' span cubed. */
const WEIGHT_MOST: number = 1e3;

/** Bisections of the weight's logarithm. */
const BISECTIONS: number = 48;
