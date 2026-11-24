/**
 * The boundary of a yes-or-no condition between two arguments, the condition
 * holding at one and not at the other, by bisection.
 *
 * Each step reads the condition at the bracket's midpoint and keeps the half
 * whose ends still disagree, so the bracket halves on every step and the
 * boundary never leaves it. Where the condition is the sign of a continuous
 * function, `bracketedRoot` finds the crossing in fewer evaluations; this is
 * for a condition that has no value to interpolate, or whose value jumps (one
 * shape left as another is met), where a chord would misread it. The ends are
 * the caller's to have read: neither is evaluated here.
 *
 * @param holds The condition.
 * @param low The end where the condition holds; it may lie either side of
 *   `high`.
 * @param high The end where it does not.
 * @param tolerance The bracket width at which the search stops, in the
 *   argument's unit; positive. A tolerance finer than the spacing of doubles at
 *   the boundary stops at two adjacent doubles instead, the finest bracket the
 *   arithmetic holds.
 * @returns The end of the final bracket where the condition does not hold,
 *   within `tolerance` of the boundary, or one double from it when the
 *   tolerance is finer than that; `high` itself when the bracket is already no
 *   wider than `tolerance`.
 * @throws If an end is not finite or the tolerance is not positive and finite.
 */
export function bracketedBisection(
  holds: (x: number) => boolean,
  low: number,
  high: number,
  tolerance: number,
): number {
  if (!(tolerance > 0))
    throw new Error("A bracketed bisection needs a positive finite tolerance");
  let lo: number = low;
  let hi: number = high;
  while (Math.abs(hi - lo) > tolerance) {
    // Ends past half the largest double overflow their sum; halving each
    // first keeps that midpoint finite.
    const mid: number =
      Math.abs(lo) > Number.MAX_VALUE / 2 || Math.abs(hi) > Number.MAX_VALUE / 2
        ? lo / 2 + hi / 2
        : (lo + hi) / 2;

    // Adjacent ends have no double between them: the midpoint rounds onto
    // one, and keeping it would repeat the same bracket forever.
    if (!(mid > Math.min(lo, hi) && mid < Math.max(lo, hi))) break;
    if (holds(mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}
