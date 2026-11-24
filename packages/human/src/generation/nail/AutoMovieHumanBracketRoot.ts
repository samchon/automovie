/**
 * The root of a scalar function on a bracket, to the accuracy a fixed number of halvings gives, in fewer evaluations.
 *
 * Brent's method (Brent, Algorithms for Minimization without Derivatives, 1973, ch. 4; Press et al., Numerical Recipes, 3rd ed.,
 * 2007, section 9.3): inverse quadratic interpolation or a secant step while it lands inside the bracket and shrinks it fast enough,
 * a bisection step otherwise, so the bracket always holds the root and never shrinks slower than bisection would. It stops when the
 * bracket is as narrow as `halvings` bisections of the starting one would leave it, and returns a point of that bracket, so its
 * result stands within that width of the root, as the bisection's midpoint does. Without a sign change over the bracket it repeats
 * the plain bisection exactly, since that is what the readers it replaces returned.
 */
export namespace AutoMovieHumanBracketRoot {
  /**
   * The root of `f` between `low` and `high`.
   *
   * @param f The function, continuous on the bracket.
   * @param low One end of the bracket.
   * @param high The other end.
   * @param halvings How many bisections the accuracy matches.
   * @returns A point within `|high - low| / 2^halvings` of a root when `f` changes sign over the bracket.
   * @evidence contracts/development/implementation.md#principled-implementation Brent's safeguarded interpolation with the bisection fallback, bracket kept at every step.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No step leaves the bracket; without a sign change the plain bisection runs unchanged.
   */
  export function solve(f: (x: number) => number, low: number, high: number, halvings: number): number {
    let a: number = low, b: number = high;
    let fa: number = f(a), fb: number = f(b);
    if (!(fa * fb <= 0) || !Number.isFinite(fa) || !Number.isFinite(fb)) return bisect(f, low, high, halvings);
    if (fa === 0) return a;
    if (fb === 0) return b;
    const width: number = Math.abs(high - low) / 2 ** halvings;
    let c: number = a, fc: number = fa, d: number = b - a, e: number = d;

    // At most the halvings bisection itself would take, plus the interpolation steps that never shrink the bracket by half.
    for (let i: number = 0; i < 4 * halvings + 8; ++i) {
      if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) {
        c = a; fc = fa; d = b - a; e = d;
      }
      if (Math.abs(fc) < Math.abs(fb)) {
        a = b; b = c; c = a; fa = fb; fb = fc; fc = fa;
      }
      // Half the halvings' width, and never under the double spacing at the current point (Numerical Recipes' `2 EPS |b|`).
      const tolerance: number = Math.max(width / 2, 2 * Number.EPSILON * Math.abs(b));
      const middle: number = (c - b) / 2;
      if (Math.abs(middle) <= tolerance || fb === 0) return b;
      if (Math.abs(e) >= tolerance && Math.abs(fa) > Math.abs(fb)) {
        const s: number = fb / fa;
        let p: number, q: number;
        if (a === c) {
          p = 2 * middle * s;
          q = 1 - s;
        } else {
          const r: number = fb / fc, t: number = fa / fc;
          p = s * (2 * middle * t * (t - r) - (b - a) * (r - 1));
          q = (t - 1) * (r - 1) * (s - 1);
        }
        if (p > 0) q = -q;
        p = Math.abs(p);
        if (2 * p < Math.min(3 * middle * q - Math.abs(tolerance * q), Math.abs(e * q))) {
          e = d; d = p / q;
        } else {
          d = middle; e = d;
        }
      } else {
        d = middle; e = d;
      }
      a = b; fa = fb;
      b += Math.abs(d) > tolerance ? d : tolerance * Math.sign(middle);
      fb = f(b);
    }
    return b;
  }

  /** The plain bisection the station reader ran: keep the half whose low end is below zero, return the last midpoint. */
  function bisect(f: (x: number) => number, low: number, high: number, halvings: number): number {
    let [a, b]: [number, number] = [low, high];
    for (let i: number = 0; i < halvings; ++i) {
      const middle: number = (a + b) / 2;
      if (f(middle) < 0) a = middle;
      else b = middle;
    }
    return (a + b) / 2;
  }
}
