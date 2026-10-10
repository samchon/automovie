/**
 * Encode linear light to one 8-bit sRGB channel.
 *
 * The value is passed through the inverse of the IEC 61966-2-1 transfer
 * function, `12.92 v` up to the linear value 0.0031308 and
 * `1.055 v^(1/2.4) - 0.055` above it, then clamped to [0,1] and rounded to the
 * nearest byte. Values at or below 0 give 0 and values at or above 1 give 255,
 * so an over-range colour saturates instead of wrapping, and NaN yields NaN and is
 * the caller's to exclude. Rounding to the nearest
 * byte is the inverse of `srgbByteToLinear` for every code, which the pair
 * guarantees by construction.
 */
export function linearToSrgbByte(linear: number): number {
  const encoded =
    linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
}
