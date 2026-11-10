/**
 * The smaller of two values with the corner where they cross rounded off, so
 * a quantity that follows whichever of two curves is lower changes over from
 * one to the other with a continuous rate.
 *
 * It is the quadratic polynomial smooth minimum: with `h = max(width - |a -
 * b|, 0) / width`, the result is `min(a, b) - h² width / 4`. It equals the
 * plain minimum wherever the two values differ by `width` or more, never
 * exceeds it, and falls below it by at most a quarter of the width, where the
 * two are equal. Its first derivative in either argument is continuous. The
 * larger of two values is the same rule negated: `-smoothMinimum(-a, -b,
 * width)`, which never falls below the plain maximum.
 *
 * @param a The first value.
 * @param b The second value.
 * @param width The difference under which the two blend, in their unit;
 *   positive.
 * @returns The rounded minimum.
 * @throws If a value is not finite or the width is not positive and finite.
 */
export function smoothMinimum(a: number, b: number, width: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b))
    throw new Error("A smooth minimum needs two finite values");
  if (!(width > 0) || !Number.isFinite(width))
    throw new Error("A smooth minimum needs a positive finite width");
  const h: number = Math.max(width - Math.abs(a - b), 0) / width;
  return Math.min(a, b) - (h * h * width) / 4;
}
