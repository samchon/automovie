/*
 * Interpolate admitted channel arrays of equal width without mutating them.
 */
export function lerpChannelValues(
  a: number[],
  b: number[],
  t: number,
): number[] {
  return a.map((v: number, i: number): number => v + (b[i]! - v) * t);
}
