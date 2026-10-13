/**
 * Whether `leftNumerator / leftDenominator` equals
 * `rightNumerator / rightDenominator` exactly.
 *
 * Returns false, rather than throwing, when any term is not a safe integer or
 * either denominator is not positive, because such a pair names no MP4 clock
 * ratio. Callers compare a duration on one timescale with a duration on
 * another, where dividing in floating point can make two unequal clocks look
 * equal.
 *
 * @evidence contracts/common.md#principled-implementation Two fractions with positive denominators are equal exactly when their cross products are equal, and the products are formed in BigInt so terms up to 2^53 multiply without rounding; a zero or negative denominator is excluded because cross-multiplication would then call unrelated values equal, such as 1/0 and 2/0.
 * @evidence contracts/common.md#clear-and-simple-design One expression decides admissibility and equality, and the boolean result lets `neutralTrackPresentation` fold an invalid clock into its refusal without a separate error path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance or rounding is applied and no clock value is special-cased; invalid terms are reported as unequal, never coerced.
 * @evidence contracts/common.md#meaningful-documentation The doc states the exact relation compared, which inputs return false instead of throwing and why, and the float-division hazard callers avoid by using it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The function performs two fixed-size BigInt multiplications and chooses no algorithm or data structure.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant-time comparison of four numbers coordinates no work worth sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The temporary BigInt values die with the call, and nothing is retained or opened.
 */
export const equalRational = (
  leftNumerator: number,
  leftDenominator: number,
  rightNumerator: number,
  rightDenominator: number,
): boolean =>
  [leftNumerator, leftDenominator, rightNumerator, rightDenominator].every(
    (term: number): boolean => Number.isSafeInteger(term),
  ) &&
  leftDenominator > 0 &&
  rightDenominator > 0 &&
  BigInt(leftNumerator) * BigInt(rightDenominator) ===
    BigInt(rightNumerator) * BigInt(leftDenominator);
