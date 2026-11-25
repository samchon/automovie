/**
 * The least of a function of one variable on an interval, by Brent's method:
 * golden-section search safeguarding successive parabolic interpolation, the
 * procedure `localmin` of Brent 1973, "Algorithms for Minimization without
 * Derivatives", chapter 5, ported from the book's description.
 *
 * The method keeps the bracket `[a, b]`, the best point `x`, the second best
 * `w` and the previous `w`, `v`. Each step fits the parabola through `x`, `w`
 * and `v`; its vertex is taken when it lies inside the bracket and the step is
 * under half the step before the last, and the golden section of the larger
 * part of the bracket otherwise. No point is evaluated within `tol` of another,
 * where `tol = √ε |x| + t` (`ε` the machine precision, `t` the absolute
 * tolerance), and the search ends once `x` lies within `2 tol` of the bracket's
 * middle less half its width. On a unimodal function the point found is the
 * minimum within `3 tol`; on any other it is a local minimum.
 *
 * @param f The function.
 * @param a The interval's low end.
 * @param b The interval's high end, above `a`.
 * @param t The absolute tolerance, in the variable's own units, from the call
 *   site's requirement.
 * @returns The point found and the function there.
 */
export function minimizeHumanBrent(
  f: (x: number) => number,
  a: number,
  b: number,
  t: number,
): minimizeHumanBrent.IMinimum {
  let low: number = a;
  let high: number = b;
  let x: number = low + GOLDEN * (high - low);
  let w: number = x;
  let v: number = x;
  let fx: number = f(x);
  let fw: number = fx;
  let fv: number = fx;
  let d: number = 0;
  let e: number = 0;
  for (;;) {
    const middle: number = (low + high) / 2;
    const tol: number = ROOT_EPSILON * Math.abs(x) + t;
    const tol2: number = 2 * tol;
    if (Math.abs(x - middle) <= tol2 - (high - low) / 2) break;
    let p: number = 0;
    let q: number = 0;
    let r: number = 0;
    if (Math.abs(e) > tol) {
      // The parabola through x, w and v.
      r = (x - w) * (fx - fv);
      q = (x - v) * (fx - fw);
      p = (x - v) * q - (x - w) * r;
      q = 2 * (q - r);
      if (q > 0) p = -p;
      else q = -q;
      r = e;
      e = d;
    }
    if (
      Math.abs(p) < Math.abs(0.5 * q * r) &&
      p > q * (low - x) &&
      p < q * (high - x)
    ) {
      // A parabolic step, kept off the bracket's ends.
      d = p / q;
      const u: number = x + d;
      if (u - low < tol2 || high - u < tol2) d = x < middle ? tol : -tol;
    } else {
      // A golden-section step into the larger part of the bracket.
      e = (x < middle ? high : low) - x;
      d = GOLDEN * e;
    }
    const u: number = x + (Math.abs(d) >= tol ? d : d > 0 ? tol : -tol);
    const fu: number = f(u);
    if (fu <= fx) {
      if (u < x) high = x;
      else low = x;
      v = w;
      fv = fw;
      w = x;
      fw = fx;
      x = u;
      fx = fu;
    } else {
      if (u < x) low = u;
      else high = u;
      if (fu <= fw || w === x) {
        v = w;
        fv = fw;
        w = u;
        fw = fu;
      } else if (fu <= fv || v === x || v === w) {
        v = u;
        fv = fu;
      }
    }
  }
  return { at: x, value: fx };
}

/** Companion types of {@link minimizeHumanBrent}. */
export namespace minimizeHumanBrent {
  /** The point found and the function there. */
  export interface IMinimum {
    /** The point. */
    at: number;

    /** The function's value there. */
    value: number;
  }
}

/** The golden section's smaller share, `(3 − √5) / 2`. */
const GOLDEN: number = (3 - Math.sqrt(5)) / 2;

/** The square root of the machine precision, the method's relative tolerance. */
const ROOT_EPSILON: number = Math.sqrt(Number.EPSILON);
