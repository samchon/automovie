/**
 * Round an exact signed production tick to nearest, choosing the higher tick on a tie.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Takes a signed numerator and a strictly positive denominator and returns the nearest integer tick without narrowing its range.
 * @evidence contracts/development/implementation.md#principled-implementation Normalize a negative remainder to compute floor, then compare the remainder to half the denominator.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares the same nearest-tick rule between admitted frame boundaries and virtual ramp anchors outside the film.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact bigint arithmetic preserves signed ties and avoids unsafe destination tick coercion.
 * @evidence contracts/development/implementation.md#efficient-algorithms Computes one division, remainder and rounding adjustment on the input integers.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One rational tick in and one returned integer, with no shared intermediate.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No retained data or handles.
 */
export function roundProductionGridTick(
  numerator: bigint,
  denominator: bigint,
): bigint {
  const remainder: bigint = numerator % denominator;
  const fraction: bigint = remainder < 0n ? remainder + denominator : remainder;
  return (
    (numerator - fraction) / denominator +
    (fraction * 2n >= denominator ? 1n : 0n)
  );
}
