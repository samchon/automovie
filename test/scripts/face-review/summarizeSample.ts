/** The size, mean and sample standard deviation of one set of numbers. */
export interface ISampleSummary {
  subjects: number;
  mean: number;
  sd: number;
}

/**
 * Summarize one sample by its mean and its unbiased (n - 1) standard
 * deviation, each rounded to `digits` decimals.
 *
 * The norms tables report a population by these two numbers, and the sample
 * standard deviation is the estimate of the population's when the subjects
 * are a draw from it. A sample of fewer than two has no spread, so it refuses
 * instead of reporting zero, which would read as a measured absence of
 * variation. Rounding is to the nearest decimal of the value's exact binary
 * expansion. Pure.
 */
export function summarizeSample(
  values: readonly number[],
  digits: number,
): ISampleSummary {
  if (values.length < 2)
    throw new Error("A standard deviation needs at least two subjects.");
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1);
  const round = (value: number): number => Number(value.toFixed(digits));
  return {
    subjects: values.length,
    mean: round(mean),
    sd: round(Math.sqrt(variance)),
  };
}
