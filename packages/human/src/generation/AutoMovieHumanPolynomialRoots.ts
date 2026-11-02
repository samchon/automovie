/** Real polynomial roots isolated by the stationary points of each derivative. */
export namespace AutoMovieHumanPolynomialRoots {
  /** Ascending monomial coefficients. */
  export type Polynomial = number[];

  /** Horner evaluation in the polynomial's declared coordinate. */
  export function value(p: Polynomial, x: number): number {
    let result: number = 0;
    for (let i: number = p.length - 1; i >= 0; i--) result = result * x + p[i]!;
    return result;
  }

  /** Exact symbolic derivative before floating-point evaluation. */
  export function derivative(p: Polynomial): Polynomial { return p.slice(1).map((n: number, i: number): number => n * (i + 1)); }

  /** Convolution of ascending coefficient arrays. */
  export function multiply(a: Polynomial, b: Polynomial): Polynomial {
    const result: number[] = Array.from({ length: a.length + b.length - 1 }, (): number => 0);
    for (let i: number = 0; i < a.length; i++) for (let j: number = 0; j < b.length; j++) result[i + j]! += a[i]! * b[j]!;
    return result;
  }

  /** Linear combination preserving coefficients needed by root isolation. */
  export function add(a: Polynomial, b: Polynomial, scale: number = 1): Polynomial {
    return Array.from({ length: Math.max(a.length, b.length) }, (_: unknown, i: number): number => (a[i] ?? 0) + scale * (b[i] ?? 0));
  }

  /**
   * Find every root in a bounded interval. Consecutive derivative roots split
   * the polynomial into monotone pieces, each containing at most one simple
   * root. Critical points are inspected separately to retain repeated roots.
   * The tolerances are floating-point evaluation controls, not anatomy limits.
   */
  export function between(input: Polynomial, lo: number, hi: number): number[] {
    const p: Polynomial = [...input];
    while (p.length > 1 && p[p.length - 1] === 0) p.pop();
    if (p.length <= 1) return [];
    if (p.length === 2) {
      const root: number = -p[0]! / p[1]!;
      return root >= lo && root <= hi ? [root] : [];
    }

    const critical: number[] = between(derivative(p), lo, hi);
    const divisions: number[] = [lo, ...critical, hi];
    const roots: number[] = [];
    const scale: number = p.reduce((sum: number, n: number): number => sum + Math.abs(n), 0);
    const zero: number = 128 * Number.EPSILON * scale;
    for (const x of divisions) if (Math.abs(value(p, x)) <= zero) roots.push(x);
    for (let i: number = 1; i < divisions.length; i++) {
      let a: number = divisions[i - 1]!;
      let b: number = divisions[i]!;
      let fa: number = value(p, a);
      if (fa * value(p, b) >= 0) continue;
      for (let j: number = 0; j < 60; j++) {
        const mid: number = (a + b) / 2;
        const fm: number = value(p, mid);
        if (fa * fm <= 0) b = mid;
        else { a = mid; fa = fm; }
      }
      roots.push((a + b) / 2);
    }
    return roots.sort((a: number, b: number): number => a - b).filter((x: number, i: number, all: number[]): boolean => i === 0 || x - all[i - 1]! > 1e-10);
  }
}
