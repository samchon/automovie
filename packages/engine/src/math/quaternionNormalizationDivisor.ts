/**
 * Positive rescaling for up to four squared binary64 components, or one when
 * the original normalization arithmetic is safe. Finite positive magnitudes
 * below 2^-511 or above 2^510 need rescaling. Zero and nonfinite components
 * retain the ordinary formula and its existing propagation.
 */
export function quaternionNormalizationDivisor(
  x: number,
  y: number,
  z: number,
  w: number = 0,
): number {
  const largest: number = Math.max(
    Math.abs(x),
    Math.abs(y),
    Math.abs(z),
    Math.abs(w),
  );
  return largest > 0 &&
    (largest < 2 ** -511 || largest > 2 ** 510)
    ? largest
    : 1;
}
