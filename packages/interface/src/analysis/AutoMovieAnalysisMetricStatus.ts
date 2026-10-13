/**
 * How one metric came out.
 *
 * `meets` and `misses` are the only two that mean a number was produced and
 * compared. `untargeted` means a number exists but nobody said what good is.
 * `unsupported` and `not-run` mean there is no number at all, and they carry
 * the reason instead.
 *
 * Run validation ties the status to the metric's other fields: `meets` and
 * `misses` must agree with the value compared against the target in its
 * direction, `untargeted` carries neither target nor comparison, and the two
 * value-less statuses require a gap.
 */
export type AutoMovieAnalysisMetricStatus =
  | "meets"
  | "misses"
  | "untargeted"
  | "unsupported"
  | "not-run";
