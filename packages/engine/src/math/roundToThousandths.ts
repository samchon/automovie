/**
 * Rounds a finite number to three decimal places, the precision a diagnostic or
 * review message quotes a measurement in, such as millimetres of a distance or
 * milliseconds of a time.
 *
 * The result is for prose only: it is the nearest binary double to the decimal,
 * so it prints with at most three decimals but is not exact arithmetic.
 *
 * @param value Measurement to quote.
 * @returns `Math.round(value * 1000) / 1000`.
 *
 * @evidence contracts/common.md#principled-implementation Scales by 1000, rounds half up with `Math.round`, and scales back, so `String` of the result prints at most three decimals for the magnitudes messages quote; the premise is a finite value well inside the safe-integer range after scaling, and a non-finite value passes through unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One quoting precision for message prose, imported by the film-grammar cut and pacing findings instead of each keeping a private `round`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no caller or quantity; it rounds every value by the same rule and is never used to decide a comparison.
 * @evidence contracts/common.md#meaningful-documentation States the precision, that the result is for prose rather than exact arithmetic, and the exact formula.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One multiply, one round and one divide, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar function that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates and retains nothing; it returns a number.
 */
export const roundToThousandths = (value: number): number =>
  Math.round(value * 1_000) / 1_000;
