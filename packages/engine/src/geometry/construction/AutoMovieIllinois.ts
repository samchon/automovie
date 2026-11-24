/**
 * A root of a continuous function inside a bracket by the Illinois rule:
 * regula falsi that halves the stored value of the end kept twice in a row,
 * improving the one-sided stagnation of plain regula falsi. The familiar
 * superlinear order concerns a sufficiently regular simple root, not every
 * continuous residual (Dowell and Jarratt, A modified regula falsi method for
 * computing the root of an equation, BIT 11, 1971).
 *
 * The bracket's ends must give values of opposite signs (or one zero), and
 * the root found stays inside it, so a monotone function gives its one root.
 */
export namespace AutoMovieIllinois {
  /**
   * The root in `[a, b]`.
   *
   * @param f The function.
   * @param a One end of the bracket.
   * @param b The other end.
   * @param tolerance Largest accepted `|f|` at the root, in `f`'s units.
   * @param iterations Most steps; the last estimate is returned past them.
   * @returns The root, or null when the ends do not bracket a sign change.
   */
  export function root(
    f: (x: number) => number,
    a: number,
    b: number,
    tolerance: number,
    iterations: number,
  ): number | null {
    return select((x: number): number => x, f, [a, a], [b, b], tolerance, iterations);
  }

  /** Apply the same bracketed rule and return the selected evaluated trial. */
  export function select<T>(
    evaluate: (x: number) => T,
    residual: (trial: T) => number,
    a: readonly [number, T],
    b: readonly [number, T],
    tolerance: number,
    iterations: number,
  ): T | null {
    let x0: number = a[0];
    let x1: number = b[0];
    let f0: number = residual(a[1]);
    let f1: number = residual(b[1]);
    if (f0 === 0) return a[1];
    if (f1 === 0) return b[1];
    if (!(f0 * f1 < 0)) return null;
    let side: number = 0;
    let selected: T = a[1];
    for (let i: number = 0; i < iterations; i++) {
      const x: number = (x0 * f1 - x1 * f0) / (f1 - f0);
      selected = evaluate(x);
      const fx: number = residual(selected);
      if (Math.abs(fx) <= tolerance) return selected;
      if (fx * f1 < 0) {
        // The root lies between x and x1: x0's end is replaced.
        x0 = x1;
        f0 = f1;
        x1 = x;
        f1 = fx;
        side = 0;
      } else {
        // x1's end is replaced while x0 stays: halve x0's value after the
        // second time it stays, the Illinois step.
        x1 = x;
        f1 = fx;
        if (side === -1) f0 /= 2;
        side = -1;
      }
    }
    return selected;
  }
}
