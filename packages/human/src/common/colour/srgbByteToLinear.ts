/**
 * Decode one 8-bit sRGB channel to linear light in [0,1].
 *
 * The byte is divided by 255 and passed through the sRGB electro-optical
 * transfer function of IEC 61966-2-1: the linear segment `c / 12.92` up to the
 * encoded value 0.04045 and the power segment `((c + 0.055) / 1.055)^2.4`
 * above it. The rounded standard breakpoint has a small discontinuity; the
 * converter applies its specified branches. Byte 0 and 255 map exactly to
 * 0 and 1. A value outside 0 to 255 is extrapolated by
 * the same formula and not clamped, so a caller that must stay in range clamps
 * the byte first. The function owns this formula for every recolouring rule of
 * the package, so a texture decoded by one rule and encoded by another
 * (`linearToSrgbByte`) agrees on the curve.
 *
 * @evidence contracts/common.md#principled-implementation Divides by 255 and applies the sRGB linear/power branches; callers admit or clamp range before this extrapolating converter.
 * @evidence contracts/common.md#clear-and-simple-design One decoder keeps pigment and optical readers on the same linear-light curve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transfer coefficients define sRGB, not sampled skin values or fixture-specific corrections.
 * @evidence contracts/common.md#meaningful-documentation Documents endpoints, linear units, extrapolation and the matching encoder.
 * @evidence contracts/performance.md#efficient-algorithms A division, branch and at most one scalar power cost O(1) per channel.
 * @evidence contracts/performance.md#reuse-equivalent-work Texture readers reuse the stateless curve without caching images or caller values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a scalar without acquiring buffers, handles or asynchronous work.
 */
export function srgbByteToLinear(byte: number): number {
  const encoded: number = byte / 255;
  return encoded <= 0.04045
    ? encoded / 12.92
    : ((encoded + 0.055) / 1.055) ** 2.4;
}
