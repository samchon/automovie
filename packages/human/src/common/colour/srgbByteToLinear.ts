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
 *
 * @evidence contracts/common.md#principled-implementation The two-segment sRGB transfer function of IEC 61966-2-1 is the specified decoding of an 8-bit sRGB code to linear light, and its two pieces are continuous at the breakpoint, so the composition with the inverse in `linearToSrgbByte` returns every byte unchanged; blending colours in this linear space is the physically meaningful average of light.
 * @evidence contracts/common.md#clear-and-simple-design One pure function with one formula and no option, shared by every recolouring rule instead of each carrying a copy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The mapping is the published transfer function and names no subject, asset or fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states the standard, both segments and their breakpoint, the exact end points, the behaviour outside the byte range and why the formula has one owner.
 * @evidence contracts/modeling.md#spatial-conventions The input is a dimensionless 8-bit code and the output a dimensionless linear-light fraction, as the comment states; no length or frame is involved.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function converts one number and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing; the textures it helps recolour are observed under their owners.
 */
export function srgbByteToLinear(byte: number): number {
  const encoded = byte / 255;
  return encoded <= 0.04045
    ? encoded / 12.92
    : ((encoded + 0.055) / 1.055) ** 2.4;
}
