/**
 * How many swings a sampled gesture signal makes: its interior local maxima,
 * each rising from the sample before and not below the sample after, that stand
 * above a quarter of the signal's range from its least value, so a tremor near
 * the trough is not counted as a beat.
 *
 * @param signal The samples in time order.
 * @returns The count.
 */
export function everydayGestureSwings(signal: readonly number[]): number {
  const low: number = Math.min(...signal);
  const range: number = Math.max(...signal) - low;
  let count: number = 0;
  for (let i: number = 1; i + 1 < signal.length; i++)
    if (
      signal[i]! > signal[i - 1]! &&
      signal[i]! >= signal[i + 1]! &&
      signal[i]! - low > 0.25 * range
    )
      count++;
  return count;
}
