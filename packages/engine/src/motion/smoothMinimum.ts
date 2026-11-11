/**
 * The smaller of two values with the corner where they cross rounded off, so
 * a quantity that follows whichever of two curves is lower changes over from
 * one to the other with a continuous rate.
 *
 * It is the quadratic polynomial smooth minimum: with `h = max(width - |a -
 * b|, 0) / width`, the result is `min(a, b) - h² width / 4`. It equals the
 * plain minimum wherever the two values differ by `width` or more, never
 * exceeds it, and falls below it by at most a quarter of the width, where the
 * two are equal. Its first derivative in either argument is continuous. The
 * larger of two values is the same rule negated: `-smoothMinimum(-a, -b,
 * width)`, which never falls below the plain maximum.
 *
 * @param a The first value.
 * @param b The second value.
 * @param width The difference under which the two blend, in their unit;
 *   positive.
 * @returns The rounded minimum.
 * @throws If a value is not finite or the width is not positive and finite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the formula, where it equals the plain minimum, its largest departure and where, the continuity it gives, the maximum by negation, the width's unit and the thrown inputs.
 * @evidence contracts/development/implementation.md#principled-implementation The quadratic polynomial smooth minimum: the blend weight is linear in the gap and vanishes at the width, so the correction and its first derivative are zero where the plain minimum takes over and the result is once continuously differentiable.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two lines, the blend weight and the corrected minimum; the maximum is this function on negated arguments, so no second rule exists.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-finite value and a non-positive width are refused instead of falling back to the plain minimum; the width is the caller's stated unit, never a constant tuned here.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A handful of arithmetic operations in constant time, with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of three numbers that coordinates no work across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the result is a local number.
 */
export function smoothMinimum(a: number, b: number, width: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b))
    throw new Error("A smooth minimum needs two finite values");
  if (!(width > 0) || !Number.isFinite(width))
    throw new Error("A smooth minimum needs a positive finite width");
  const h: number = Math.max(width - Math.abs(a - b), 0) / width;
  return Math.min(a, b) - (h * h * width) / 4;
}
