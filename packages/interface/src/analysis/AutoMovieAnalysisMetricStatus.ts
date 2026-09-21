/**
 * How one metric came out.
 *
 * `meets` and `misses` are the only two that mean a number was produced and
 * compared. `untargeted` means a number exists but nobody said what good is.
 * `unsupported` and `not-run` mean there is no number at all, and they carry
 * the reason instead.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `AutoMovieAnalysisMetricStatus` as the portable data boundary for the diagnostics failed not run requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `AutoMovieAnalysisMetricStatus` for the validation failed not run states system contract.
 */
export type AutoMovieAnalysisMetricStatus =
  | "meets"
  | "misses"
  | "untargeted"
  | "unsupported"
  | "not-run";
