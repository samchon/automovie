/**
 * The boundary of a yes-or-no condition between two arguments, the condition
 * holding at one and not at the other, by bisection.
 *
 * Each step reads the condition at the bracket's midpoint and keeps the half
 * whose ends still disagree, so the bracket halves on every step and the
 * boundary never leaves it. Where the condition is the sign of a continuous
 * function, `bracketedRoot` finds the crossing in fewer evaluations; this is
 * for a condition that has no value to interpolate, or whose value jumps
 * (one shape left as another is met), where a chord would misread it. The
 * ends are the caller's to have read: neither is evaluated here.
 *
 * @param holds The condition.
 * @param low The end where the condition holds; it may lie either side of
 *   `high`.
 * @param high The end where it does not.
 * @param tolerance The bracket width at which the search stops, in the
 *   argument's unit; positive. A tolerance finer than the spacing of doubles
 *   at the boundary stops at two adjacent doubles instead, the finest bracket
 *   the arithmetic holds.
 * @returns The end of the final bracket where the condition does not hold,
 *   within `tolerance` of the boundary, or one double from it when the
 *   tolerance is finer than that; `high` itself when the bracket is already
 *   no wider than `tolerance`.
 * @throws If an end is not finite or the tolerance is not positive and
 *   finite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method, which end each argument is, why the ends are not read, when to prefer the bracketed root, the unit of the tolerance, which end is returned and every thrown input.
 * @evidence contracts/development/implementation.md#principled-implementation Bisection: the midpoint is read and the half whose ends disagree is kept, which needs nothing of the condition but that it holds at one end and not at the other, and keeps the boundary inside the bracket on every step. It ends at the requested width or at two adjacent doubles, where the midpoint equals an end (the machine-resolution stop of a floating-point bisection); a sum of ends that overflows is replaced by the sum of their halves.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over two ends; callers pass only the condition, the bracket and the tolerance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-finite end and a non-positive tolerance are refused instead of answered with an end; no condition or caller is special-cased.
 * @evidence contracts/development/implementation.md#efficient-algorithms One evaluation a step, ceil(log2(|high - low| / tolerance)) in all, the fewest any search that reads only a yes or a no can take; the ends are not read again. A midpoint that rounds onto an end stops the search (the bracket holds no double between its ends), so the count is also at most log2 of the widest finite bracket over the least spacing of doubles, log2(2^1025 / 2^-1074) = 2099, whatever the tolerance.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments that evaluates each midpoint once and coordinates no work across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds two numbers for the duration of the call and retains nothing.
 */
export function bracketedBisection(
  holds: (x: number) => boolean,
  low: number,
  high: number,
  tolerance: number,
): number {
  if (!Number.isFinite(low) || !Number.isFinite(high))
    throw new Error("A bracketed bisection needs two finite ends");
  if (!(tolerance > 0) || !Number.isFinite(tolerance))
    throw new Error("A bracketed bisection needs a positive finite tolerance");
  let lo: number = low;
  let hi: number = high;
  while (Math.abs(hi - lo) > tolerance) {
    // Ends past half the largest double overflow their sum; halving each
    // first keeps that midpoint finite.
    let mid: number = (lo + hi) / 2;
    if (!Number.isFinite(mid)) mid = lo / 2 + hi / 2;

    // Adjacent ends have no double between them: the midpoint rounds onto
    // one, and keeping it would repeat the same bracket forever.
    if (!(mid > Math.min(lo, hi) && mid < Math.max(lo, hi))) break;
    if (holds(mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}
