/*
 * Interpolate admitted channel arrays of equal width without mutating them.
 */
export function lerpChannelValues(
  a: number[],
  b: number[],
  t: number,
): number[] {
  return a.map((start: number, index: number): number => {
    const end: number = b[index]!;
    const difference: number = end - start;
    if (
      Number.isFinite(difference) ||
      !Number.isFinite(start) ||
      !Number.isFinite(end)
    )
      return start + difference * t;

    // The finite endpoints have opposite signs. Weight them before adding
    // so their overflowing difference never enters the convex blend.
    return (1 - t) * start + t * end;
  });
}
