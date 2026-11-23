/**
 * Linear interpolation of one scalar, `from · (1 − progress) + to · progress`.
 *
 * This weighted form returns `from` exactly at `progress = 0` and `to` exactly
 * at `progress = 1`, so a formation cue lands on its authored end value without
 * rounding drift. `progress` is not clamped; values outside `[0, 1]`
 * extrapolate along the same line. The formation samplers and slot positions
 * use it for every interpolated coordinate and heading.
 *
 * @param from Value at `progress = 0`.
 * @param to Value at `progress = 1`.
 * @param progress Interpolation fraction, normally in `[0, 1]`.
 */
export const lerp: (from: number, to: number, progress: number) => number = (
  from: number,
  to: number,
  progress: number,
): number => from * (1 - progress) + to * progress;
