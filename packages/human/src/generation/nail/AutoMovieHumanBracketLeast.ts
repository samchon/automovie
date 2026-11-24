/**
 * The least of a function of one variable within a bracket, by Brent's method: golden sections safeguarding parabolic steps through the
 * three best points (R. P. Brent, Algorithms for Minimization without Derivatives, 1973, ch. 5, `localmin`). On a smooth function it
 * converges superlinearly where golden sections alone gain a factor 0.618 an evaluation, and it never takes more evaluations than
 * golden sections would to the same width by more than a small factor.
 */
export namespace AutoMovieHumanBracketLeast {
  /** The golden section's share, `(3 - sqrt 5) / 2`. */
  const GOLD: number = (3 - Math.sqrt(5)) / 2;

  /** Relative precision of the arithmetic, the square root of the machine epsilon (Brent's `eps`). */
  const EPS: number = Math.sqrt(Number.EPSILON);

  /**
   * The least of `f` on `[low, high]`, to within `tolerance` of its abscissa.
   *
   * @param f The function, finite on the bracket.
   * @param low The bracket's lower end.
   * @param high The bracket's upper end, above `low`.
   * @param tolerance The abscissa's absolute tolerance, positive.
   * @returns The abscissa and the value there.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Brent's localmin: a parabolic step through the three best points, accepted only inside the bracket and shorter than half the step before last, otherwise a golden section.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over Brent's state.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No step is taken closer than the tolerance to a point already read; the bracket only shrinks.
   * @evidence contracts/development/implementation.md#efficient-algorithms One evaluation an iteration.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every value read is kept as one of the three best while it is one.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two numbers.
   * @evidence contracts/development/common.md#meaningful-documentation States the method, its source and the stopping rule.
   */
  export function least(f: (x: number) => number, low: number, high: number, tolerance: number): { at: number; value: number } {
    let [a, b]: [number, number] = [low, high];
    let x: number = a + GOLD * (b - a);
    let [w, v]: [number, number] = [x, x];
    let fx: number = f(x);
    let [fw, fv]: [number, number] = [fx, fx];
    let [d, e]: [number, number] = [0, 0];
    for (;;) {
      const m: number = (a + b) / 2;
      const tol: number = EPS * Math.abs(x) + tolerance / 3;
      const t2: number = 2 * tol;
      if (Math.abs(x - m) <= t2 - (b - a) / 2) break;
      let [p, q, r]: [number, number, number] = [0, 0, 0];
      if (Math.abs(e) > tol) {
        r = (x - w) * (fx - fv);
        q = (x - v) * (fx - fw);
        p = (x - v) * q - (x - w) * r;
        q = 2 * (q - r);
        if (q > 0) p = -p;
        else q = -q;
        r = e;
        e = d;
      }
      if (Math.abs(p) < Math.abs(0.5 * q * r) && p > q * (a - x) && p < q * (b - x)) {
        d = p / q;
        const u: number = x + d;
        if (u - a < t2 || b - u < t2) d = x < m ? tol : -tol;
      } else {
        e = (x < m ? b : a) - x;
        d = GOLD * e;
      }
      const u: number = x + (Math.abs(d) >= tol ? d : d > 0 ? tol : -tol);
      const fu: number = f(u);
      if (fu <= fx) {
        if (u < x) b = x;
        else a = x;
        [v, fv, w, fw, x, fx] = [w, fw, x, fx, u, fu];
      } else {
        if (u < x) a = u;
        else b = u;
        if (fu <= fw || w === x) [v, fv, w, fw] = [w, fw, u, fu];
        else if (fu <= fv || v === x || v === w) [v, fv] = [u, fu];
      }
    }
    return { at: x, value: fx };
  }
}
