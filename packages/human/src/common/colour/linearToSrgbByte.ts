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
 *
 * @evidence contracts/common.md#principled-implementation Evaluates the sRGB inverse transfer curve, saturates encoded light to [0,1] and rounds to a byte; NaN admission remains with the caller.
 * @evidence contracts/common.md#clear-and-simple-design One scalar encoder owns texture-pigment transfer without allocating or owning images.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 0.0031308 breakpoint and 12.92/1.055/2.4 coefficients define the supported sRGB curve; saturation is declared over-range behavior.
 * @evidence contracts/common.md#meaningful-documentation Documents rounding, saturation, NaN propagation and the decoding companion.
 * @evidence contracts/performance.md#efficient-algorithms One branch, at most one power and fixed clamp/round operations cost O(1) per channel.
 * @evidence contracts/performance.md#reuse-equivalent-work All pigment writers share this pure conversion; no texel cache or mutable colour state is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one number and acquires no image buffer, handle or running task.
 */
export function linearToSrgbByte(linear: number): number {
  const encoded: number =
    linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
}
