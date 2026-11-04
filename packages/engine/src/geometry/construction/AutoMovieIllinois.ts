/**
 * A root of a continuous function inside a bracket by the Illinois rule:
 * regula falsi that halves the stored value of the end kept twice in a row,
 * so it converges superlinearly (order about 1.44) where plain regula falsi
 * stalls on one end of a convex function (Dowell and Jarratt, A modified
 * regula falsi method for computing the root of an equation, BIT 11, 1971).
 *
 * The bracket's ends must give values of opposite signs (or one zero), and
 * the root found stays inside it, so a monotone function gives its one root.
 *
 * @evidence contracts/common.md#principled-implementation The Illinois variant of regula falsi keeps a bracket and converges superlinearly on a monotone residual, the girth solve's case.
 * @evidence contracts/common.md#clear-and-simple-design One bracketed root finder with a tolerance and an iteration bound.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A bracket without a sign change is reported, never widened silently.
 * @evidence contracts/common.md#meaningful-documentation States the bracket premise, the halving rule and the stop condition.
 * @evidence contracts/performance.md#efficient-algorithms Superlinear convergence with one residual evaluation per step.
 * @evidence contracts/performance.md#reuse-equivalent-work The retained end's residual is reused, halved, instead of re-evaluated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps two bracket ends and their residuals only.
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
    let x0: number = a;
    let x1: number = b;
    let f0: number = f(x0);
    let f1: number = f(x1);
    if (f0 === 0) return x0;
    if (f1 === 0) return x1;
    if (!(f0 * f1 < 0)) return null;
    let side: number = 0;
    let x: number = x0;
    for (let i: number = 0; i < iterations; i++) {
      x = (x0 * f1 - x1 * f0) / (f1 - f0);
      const fx: number = f(x);
      if (Math.abs(fx) <= tolerance) return x;
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
    return x;
  }
}
