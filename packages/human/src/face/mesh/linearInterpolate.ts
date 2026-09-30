/**
 * Linear interpolation; callers decide whether extrapolation is meaningful.
 */
export const linearInterpolate = (a: number, b: number, t: number): number =>
  a + (b - a) * t;
