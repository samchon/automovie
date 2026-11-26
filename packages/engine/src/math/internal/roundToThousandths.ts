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
export function roundToThousandths(value: number): number {
  // A value past a thousandth of the largest double has no thousandths.
  return Math.abs(value) > Number.MAX_VALUE / 1_000
    ? value
    : Math.round(value * 1_000) / 1_000;
}
