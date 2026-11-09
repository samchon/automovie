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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bracket premise, the halving rule and the stop condition.
 * @evidence contracts/development/design.md#principled-representation Represents A root of a continuous function inside a bracket by the Illinois rule: regula falsi that halves the stored value of the end kept twice in a row, improving the one-sided stagnation of plain regula falsi: companion namespace of 1 member (`root`); units and frames named in its text: second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieIllinois` in packages/engine/src/geometry/construction/AutoMovieIllinois.ts; its surface is the 1 member listed and the text shows 20 other files naming it, mostly packages/human (18), packages/engine (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the Illinois false-position update on a continuous sign-changing bracket; the girth caller supplies a monotone residual, and sign products/interpolation assume representable intermediate arithmetic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two endpoints, their stored residuals and the retained-side flag contain the entire iteration state.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact endpoint zeros return directly, a failed sign-product check returns null, and exhausting the bound returns the last estimate without a convergence certificate.
   * @evidence contracts/development/common.md#meaningful-documentation States residual tolerance, endpoint admission and the iteration-limit return; it does not promise the tolerance is met on exhaustion.
   * @evidence contracts/development/implementation.md#efficient-algorithms Evaluates two endpoint residuals and at most one residual per requested iteration, using constant working storage in addition to f's cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses retained endpoint residuals and applies Illinois weighting instead of reevaluating those endpoints; f's effects are not shared across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds only scalar iteration state and the supplied callback during the synchronous call; no task or cache survives return or a thrown callback.
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
