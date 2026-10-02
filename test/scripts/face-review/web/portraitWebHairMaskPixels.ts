/**
 * Keep fibre alpha while making even a black hair texture a white ID mask.
 *
 * The result is a new array of the same length: every texel is white with the
 * source's exact alpha, and the caller's bytes stay untouched. A length that
 * is not a whole number of RGBA texels refuses. Pure.
 */
export function portraitWebHairMaskPixels(
  rgba: Uint8ClampedArray,
): Uint8ClampedArray {
  if (rgba.length % 4 !== 0)
    throw new Error("Hair mask needs complete RGBA pixels.");
  const white = new Uint8ClampedArray(rgba.length);
  for (let offset = 0; offset < rgba.length; offset += 4) {
    white.fill(255, offset, offset + 3);
    white[offset + 3] = rgba[offset + 3]!;
  }
  return white;
}
