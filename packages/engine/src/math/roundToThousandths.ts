/**
 * Quote a measurement at three decimal places, such as millimetres of distance
 * or milliseconds of time, using binary64 scaling and Math.round.
 *
 * The result is for prose, with the rounding of the scaled binary64 value
 * rather than exact decimal arithmetic. Very large magnitudes may print in
 * scientific notation.
 *
 * @param value Measurement to quote.
 * @returns Math.round(value * 1000) / 1000 when the scaled value is
 *   representable; otherwise a finite input is already coarser than the
 *   requested decimal precision and is returned unchanged.
 */
export const roundToThousandths: (value: number) => number = (
  value: number,
): number => {
  const scaled: number = value * 1_000;
  return Number.isFinite(value) && !Number.isFinite(scaled)
    ? value
    : Math.round(scaled) / 1_000;
};
