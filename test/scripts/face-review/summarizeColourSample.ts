/** The size, per-channel mean and per-channel sample deviation of colour triples. */
export interface IColourSampleSummary {
  subjects: number;
  mean: [number, number, number];
  /** `null` per channel when the sample has one subject and no spread. */
  sd: [number, number, number] | [null, null, null];
}

/**
 * Summarize colour triples by channel mean and unbiased (n - 1) standard
 * deviation, each rounded to four decimals.
 *
 * A single subject has a mean but no deviation, and reports `null` for it
 * rather than a zero that would read as a measured absence of spread. An empty
 * sample refuses. Pure.
 */
export function summarizeColourSample(
  values: readonly (readonly [number, number, number])[],
): IColourSampleSummary {
  if (values.length === 0) throw new Error("A summary needs a subject.");
  const round = (value: number): number => Number(value.toFixed(4));
  const mean = [0, 1, 2].map(
    (channel) =>
      values.reduce((sum, value) => sum + value[channel]!, 0) / values.length,
  );
  const sd =
    values.length < 2
      ? ([null, null, null] as [null, null, null])
      : ([0, 1, 2].map((channel) =>
          round(
            Math.sqrt(
              values.reduce(
                (sum, value) => sum + (value[channel]! - mean[channel]!) ** 2,
                0,
              ) /
                (values.length - 1),
            ),
          ),
        ) as [number, number, number]);
  return {
    subjects: values.length,
    mean: mean.map(round) as [number, number, number],
    sd,
  };
}
