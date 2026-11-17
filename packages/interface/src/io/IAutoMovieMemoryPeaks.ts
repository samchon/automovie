/**
 * Componentwise maxima of host-observed used heap and resident bytes during a run.
 * The host chooses sample times and initializes the accumulator; the two maxima
 * need not occur at the same instant. Unobserved inter-sample peaks are unknown.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States byte units, componentwise timing and the limits of sampled maxima.
 * @evidence contracts/development/design.md#principled-representation Separate heap and resident maxima preserve overlapping accounting without claiming their sum is retained memory.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Run reports retain only the two maxima consumed by memory accounting; sampler/process ownership remains outside the record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An observed peak neither enforces a memory ceiling nor proves no larger allocation occurred between samples.
 */

export interface IAutoMovieMemoryPeaks {
  /** Observed managed heap peak in bytes. */
  heap: number;

  /** Observed resident memory peak in bytes. */
  rss: number;
}
