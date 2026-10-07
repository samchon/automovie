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
 * @evidence contracts/common.md#principled-implementation The inverse of the two-segment sRGB transfer function is the specified encoding of linear light to a code, and rounding to the nearest byte makes it the exact inverse of the decoder on every one of the 256 codes because the per-code step of the curve is far larger than the double-precision error. The clamp is the intended saturation of an out-of-gamut colour and is stated.
 * @evidence contracts/common.md#clear-and-simple-design One pure function with one formula, shared with the decoder's owner so both directions of the curve live side by side.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The mapping is the published transfer function and names no subject, asset or fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states the standard, both segments, the clamp and rounding, the saturation behaviour and the relation to the decoder.
 * @evidence contracts/modeling.md#spatial-conventions The input is a dimensionless linear-light fraction and the output a dimensionless 8-bit code, as the comment states; no length or frame is involved.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function converts one number and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing; the textures it helps recolour are observed under their owners.
 */
export function linearToSrgbByte(linear: number): number {
  const encoded =
    linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
}
