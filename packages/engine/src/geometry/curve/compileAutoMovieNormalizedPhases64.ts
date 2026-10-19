/**
 * Admit a positive normalized piecewise phase chart without changing its
 * coefficients. Cumulative boundaries must be representably increasing; only
 * the final endpoint absorbs the declared binary64 summation roundoff.
 *
 * @evidence contracts/common.md#principled-implementation Positive cumulative widths define an ordered normalized partition; the existing 64*n-epsilon total-sum allowance covers phase summation only, not geometric distances or denominator positivity.
 * @evidence contracts/common.md#clear-and-simple-design One admission owner supplies the same canonical knots to curve evaluation and exact span readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No width rescaling, geometric projection or epsilon denominator is introduced; nonpositive or unrepresentable intervals reject.
 * @evidence contracts/common.md#meaningful-documentation States normalized phase units, cumulative representability and terminal-only roundoff absorption.
 * @evidence contracts/performance.md#efficient-algorithms One O(n) pass creates n+1 scalar knots.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers retain the admitted knots for repeated point and exact-span queries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the new knot array escapes; no input or global cache is retained.
 */
export function compileAutoMovieNormalizedPhases64(
  widths: readonly number[],
  count: number,
): number[] {
  if (!Number.isSafeInteger(count) || count < 1 || widths.length !== count)
    throw new Error("Phase widths must match the polynomial spans");
  const knots: number[] = [0];
  for (let i: number = 0; i < count; ++i) {
    const width: number = widths[i]!;
    const next: number = knots[i]! + width;
    if (
      !Number.isFinite(width) ||
      width <= 0 ||
      !Number.isFinite(next) ||
      next <= knots[i]!
    )
      throw new Error("Phase widths require a resolvable positive partition");
    knots.push(next);
  }
  if (
    Math.abs(knots[count]! - 1) > 64 * count * Number.EPSILON ||
    knots[count - 1]! >= 1
  )
    throw new Error("Phase widths must cover one normalized turn");
  knots[count] = 1;
  return knots;
}
