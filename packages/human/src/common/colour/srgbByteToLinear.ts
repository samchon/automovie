/**
 * Decode one 8-bit sRGB channel to linear light in [0,1].
 *
 * The byte is divided by 255 and passed through the sRGB electro-optical
 * transfer function of IEC 61966-2-1: the linear segment `c / 12.92` up to the
 * encoded value 0.04045 and the power segment `((c + 0.055) / 1.055)^2.4`
 * above it. Both segments meet at 0.04045 within double precision, and byte 0
 * and 255 map exactly to 0 and 1. A value outside 0 to 255 is extrapolated by
 * the same formula and not clamped, so a caller that must stay in range clamps
 * the byte first. The function owns this formula for every recolouring rule of
 * the package, so a texture decoded by one rule and encoded by another
 * (`linearToSrgbByte`) agrees on the curve.
 */
export function srgbByteToLinear(byte: number): number {
  const encoded = byte / 255;
  return encoded <= 0.04045
    ? encoded / 12.92
    : ((encoded + 0.055) / 1.055) ** 2.4;
}
