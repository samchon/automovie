/**
 * Return value mod period in [0, period), preserving ordinary already-normalized values; negative zero becomes positive zero.
 *
 * Callers validate their finite positive period. Computing the remainder once avoids the extra add/subtract of double modulo, which can perturb an in-range serialized continuity phase.
 *
 * @evidence contracts/common.md#principled-implementation Computes the remainder once, adding one positive period only for a negative result and mapping a rounded period back to zero. Finite value and finite positive period are caller premises; the result is binary64 remainder arithmetic, not an exact-real phase.
 * @evidence contracts/common.md#clear-and-simple-design Owns scalar cyclic normalization shared by gait clocks, beat velocity and architecture angle comparison, leaving each domain's period admission to its caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the same remainder/sign rule for every value; the exact-period correction handles rounding at the cyclic boundary rather than a consumer-specific epsilon or phase adjustment.
 * @evidence contracts/common.md#meaningful-documentation States the half-open range, finite positive period premise, preservation of ordinary in-range values and why double modulo would perturb serialized phase.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One remainder and fixed scalar arithmetic take constant local work and space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One remainder supplies both sign handling and the final phase; no phase history is cached across caller changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one scalar without allocating records or retaining source data.
 */
export const positiveModulo: (value: number, period: number) => number = (
  value: number,
  period: number,
): number => {
  const remainder: number = value % period;
  const normalized: number = remainder + period * Number(remainder < 0);
  return normalized === period ? 0 : normalized;
};
