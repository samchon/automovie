/**
 * Linear interpolation of one scalar, `from · (1 − progress) + to · progress`.
 *
 * The weighted form reaches finite endpoints without subtraction drift.
 * Fractions outside `[0, 1]` extrapolate along the same line.
 *
 * @param from Value at `progress = 0`.
 * @param to Value at `progress = 1`.
 * @param progress Interpolation fraction, normally in `[0, 1]`.
 */
export function lerp(from: number, to: number, progress: number): number {
  return from * (1 - progress) + to * progress;
}
