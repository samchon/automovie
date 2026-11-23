/**
 * Return value mod period in [0, period), preserving ordinary
 * already-normalized values; negative zero becomes positive zero.
 *
 * Callers validate their finite positive period. Computing the remainder once
 * avoids the extra add/subtract of double modulo, which can perturb an in-range
 * serialized continuity phase.
 */
export const positiveModulo: (value: number, period: number) => number = (
  value: number,
  period: number,
): number => {
  const remainder: number = value % period;
  const normalized: number = remainder + period * Number(remainder < 0);
  return normalized === period ? 0 : normalized;
};
