/**
 * Quote a measurement at three decimal places, such as millimetres of distance or milliseconds of time, using binary64 scaling and Math.round.
 *
 * The result is for prose, with the rounding of the scaled binary64 value rather than exact decimal arithmetic. Very large magnitudes may print in scientific notation.
 *
 * @param value Measurement to quote.
 * @returns Math.round(value * 1000) / 1000 when the scaled value is representable; otherwise a finite input is already coarser than the requested decimal precision and is returned unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Uses the existing Math.round(value*1000)/1000 expression for representable scaled values. If finite input overflows that multiplication, its binary64 spacing already exceeds one thousandth, so returning the original value avoids inventing Infinity without losing representable decimal precision. Non-finite inputs keep their propagation and ordinary rounded outputs are unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One quoting precision for message prose, imported by the film-grammar cut and pacing findings instead of each keeping a private `round`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no caller or quantity; it rounds every value by the same rule and is never used to decide a comparison.
 * @evidence contracts/common.md#meaningful-documentation States the precision, that the result is for prose rather than exact arithmetic, and the exact formula.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One multiply, one round and one divide, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar function that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates and retains nothing; it returns a number.
 */
export const roundToThousandths: (value: number) => number = (
  value: number,
): number => {
  const scaled: number = value * 1_000;
  return Number.isFinite(value) && !Number.isFinite(scaled)
    ? value
    : Math.round(scaled) / 1_000;
};
