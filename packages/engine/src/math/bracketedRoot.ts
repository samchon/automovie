/**
 * A root of a continuous function between two arguments where it takes
 * opposite signs, by the Illinois variant of the false position method
 * (Dowell and Jarratt 1971).
 *
 * Each step evaluates the function where the chord through the bracket's two
 * ends crosses zero and keeps the half that still brackets the root. When the
 * same end is kept twice in a row its value is halved for the next chord, so
 * both ends close on the root and the order of convergence is about 1.44 on a
 * smooth function, against one bit a step for bisection. The root never
 * leaves the bracket, so the method needs no derivative and no guard.
 *
 * @param f The function.
 * @param low One end of the bracket.
 * @param high The other end.
 * @param tolerance The bracket width at which the search stops, in the
 *   argument's unit; positive.
 * @param limit The most evaluations after the two ends'.
 * @returns The last argument evaluated, within `tolerance` of a root unless
 *   the limit ran out first; an end itself when the function is zero there.
 * @throws If an end or its value is not finite, the two values share a sign,
 *   or the tolerance is not positive and finite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method and its source, why both ends close, the order of convergence, each parameter's unit and default, what is returned when the limit runs out or an end is a root, and every thrown input.
 * @evidence contracts/development/implementation.md#principled-implementation Dowell and Jarratt's Illinois rule: the chord's zero is evaluated, the half that keeps opposite signs is kept, and a value retained twice is halved, which removes false position's one-sided stall; the sign test keeps the root inside the bracket on every step.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over a bracket of two arguments and their values, with one flag for the end kept last; callers pass only the function and the bracket.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bracket that does not straddle a root, a non-finite end or value and a non-positive tolerance are refused instead of answered with an end; no function or caller is special-cased.
 * @evidence contracts/development/implementation.md#efficient-algorithms One evaluation a step at superlinear order 1.44 on a smooth function, against bisection's one bit a step, bounded by `limit` evaluations.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments that evaluates each argument once and coordinates no work across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds five numbers and a flag for the duration of the call and retains nothing.
 */
export function bracketedRoot(
  f: (x: number) => number,
  low: number,
  high: number,
  tolerance: number,
  limit: number = 64,
): number {
  if (!Number.isFinite(low) || !Number.isFinite(high))
    throw new Error("A bracketed root needs two finite ends");
  if (!(tolerance > 0) || !Number.isFinite(tolerance))
    throw new Error("A bracketed root needs a positive finite tolerance");
  let a: number = low;
  let b: number = high;
  let fa: number = f(a);
  let fb: number = f(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb))
    throw new Error("A bracketed root needs finite values at its ends");
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa > 0 === fb > 0)
    throw new Error("A bracketed root needs opposite signs at its ends");
  let x: number = Math.abs(fa) < Math.abs(fb) ? a : b;
  let kept: -1 | 0 | 1 = 0;
  for (let k: number = 0; k < limit && Math.abs(b - a) > tolerance; k++) {
    x = (a * fb - b * fa) / (fb - fa);
    const fx: number = f(x);
    if (fx === 0 || !Number.isFinite(fx)) return x;
    if (fx > 0 === fb > 0) {
      b = x;
      fb = fx;
      if (kept === -1) fa /= 2;
      kept = -1;
    } else {
      a = x;
      fa = fx;
      if (kept === 1) fb /= 2;
      kept = 1;
    }
  }
  return x;
}
