import { lerp } from "../../math/internal/lerp";

/** IEEE 754 binary64's first positive value with all 53 significand bits. */
const LEAST_NORMAL: number = 2 ** -1022;

/**
 * Interpolate between two finite coupling knots with the same arithmetic in
 * either direction. The input knots may descend and the query is interior.
 */
export function interpolateAffordanceTravel(
  inputFrom: number,
  inputTo: number,
  outputFrom: number,
  outputTo: number,
  query: number,
): number {
  const width: number = inputTo - inputFrom;
  const span: number = outputTo - outputFrom;
  const distance: number = query - inputFrom;
  const product: number = span * distance;
  const productMagnitude: number = Math.abs(product);
  const widthMagnitude: number = Math.abs(width);

  // IEEE 754 binary64 loses relative precision below the least normal
  // magnitude, even when dividing later would recover a normal result.
  if (
    widthMagnitude < Infinity &&
    (span === 0 ||
      (productMagnitude >= LEAST_NORMAL && productMagnitude < Infinity))
  )
    return outputFrom + product / width;

  // An overflowing signed width is representable at half scale.
  const fraction: number =
    widthMagnitude < Infinity
      ? distance / width
      : (query * 0.5 - inputFrom * 0.5) / (inputTo * 0.5 - inputFrom * 0.5);
  if (Math.abs(span) === Infinity) return lerp(outputFrom, outputTo, fraction);

  // A subnormal fraction loses accuracy before a large output span can
  // restore it. Divide the span first in that case.
  const offset: number =
    fraction >= LEAST_NORMAL || widthMagnitude === Infinity
      ? span * fraction
      : (span / width) * distance;
  return outputFrom + offset;
}
