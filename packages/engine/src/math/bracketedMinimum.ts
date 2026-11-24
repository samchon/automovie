/**
 * The argument at which a function of one variable is least on an interval, by
 * Brent's method (Brent 1973, "Algorithms for Minimization without
 * Derivatives", chapter 5, `localmin`).
 *
 * Each step fits a parabola through the three best points found and takes its
 * lowest point when that lies inside the bracket, moves less than half the step
 * before last and does not come within the tolerance of an end; otherwise it
 * takes a golden-section step into the larger part. The bracket always holds
 * the least point found, so on a function with one low on the interval (a
 * convex one, for instance) the search closes on it superlinearly where the
 * function is smooth and never slower than golden section where it is not (a
 * kink, a flat stretch).
 *
 * @param f The function; it is evaluated only inside the interval, never at its
 *   ends.
 * @param low One end of the interval.
 * @param high The other end.
 * @param tolerance The absolute width, in the argument's unit, the low is
 *   located to; positive.
 * @param limit The most evaluations.
 * @returns The argument of the least value found and that value.
 * @throws If an end is not finite or the tolerance is not positive and finite.
 */
export function bracketedMinimum(
  f: (x: number) => number,
  low: number,
  high: number,
  tolerance: number,
  limit: number = 64,
): { at: number; value: number } {
  if (!(tolerance > 0))
    throw new Error("A bracketed minimum needs a positive finite tolerance");
  let a: number = Math.min(low, high);
  let b: number = Math.max(low, high);
  let x: number = a + GOLDEN * (b - a);
  let w: number = x;
  let v: number = x;
  let fx: number = f(x);
  let fw: number = fx;
  let fv: number = fx;
  let d: number = 0;
  let e: number = 0;
  for (let k: number = 1; k < limit; k++) {
    const middle: number = (a + b) / 2;
    const near: number = EPSILON * Math.abs(x) + tolerance;
    if (Math.abs(x - middle) <= 2 * near - (b - a) / 2) break;
    let parabolic: boolean = false;
    if (Math.abs(e) > near) {
      // The parabola through (v, fv), (w, fw) and (x, fx).
      const r: number = (x - w) * (fx - fv);
      let q: number = (x - v) * (fx - fw);
      let p: number = (x - v) * q - (x - w) * r;
      q = 2 * (q - r);
      if (q > 0) p = -p;
      else q = -q;
      if (
        Math.abs(p) < Math.abs(0.5 * q * e) &&
        p > q * (a - x) &&
        p < q * (b - x)
      ) {
        e = d;
        d = p / q;
        const u: number = x + d;
        if (u - a < 2 * near || b - u < 2 * near) d = x < middle ? near : -near;
        parabolic = true;
      }
    }
    if (!parabolic) {
      e = x < middle ? b - x : a - x;
      d = GOLDEN * e;
    }
    const u: number = Math.abs(d) >= near ? x + d : x + (d > 0 ? near : -near);
    const fu: number = f(u);
    if (fu <= fx) {
      if (u < x) b = x;
      else a = x;
      v = w;
      fv = fw;
      w = x;
      fw = fx;
      x = u;
      fx = fu;
    } else {
      if (u < x) a = u;
      else b = u;
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

/** The golden section's smaller share, `(3 - sqrt 5) / 2`. */
const GOLDEN: number = (3 - Math.sqrt(5)) / 2;

/**
 * The relative tolerance of an argument: the square root of the double
 * precision, below which a function's rounding hides its curvature (Brent
 * 1973).
 */
const EPSILON: number = Math.sqrt(Number.EPSILON);
