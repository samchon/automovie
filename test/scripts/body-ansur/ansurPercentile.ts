/**
 * The value at probability `p` of a sample, by linear interpolation between
 * the sorted order statistics at position `p * (n - 1)` (the "type 7"
 * definition that `HUMAN_BODY_ANSUR_II_REFERENCE` documents for its bands).
 *
 * The sample is a set of measured people, so a percentile describes that
 * sample's spread, not a limit of the species: the caller keeps the sample's
 * sex, age range and measurement definition beside the number. An empty
 * sample, a non-finite value or a probability outside `[0, 1]` is refused
 * because no order statistic answers it. The input is not mutated.
 */
export function ansurPercentile(values: readonly number[], p: number): number {
  if (values.length === 0) throw new Error("A percentile needs a sample.");
  if (!(p >= 0 && p <= 1))
    throw new Error(`A probability lies in [0, 1]: ${p}`);
  if (values.some((value) => !Number.isFinite(value)))
    throw new Error("A percentile sample holds only finite values.");
  const sorted = [...values].sort((a, b) => a - b);
  const position = p * (sorted.length - 1);
  const low = Math.floor(position);
  const high = Math.min(low + 1, sorted.length - 1);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}
