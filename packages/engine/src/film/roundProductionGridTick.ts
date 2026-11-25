/**
 * Round an exact signed production tick to nearest, choosing the higher tick on
 * a tie.
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
