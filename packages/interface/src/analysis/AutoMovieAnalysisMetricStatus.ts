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
 *
 * @evidence contracts/common.md#principled-implementation Five literals partition a metric by whether a value exists and whether a target applied; `validateAutoMovieAnalysisRun` recomputes `meets` or `misses` from value, target and comparison and refuses a status that disagrees with that arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design One status field carries both the compared verdict and the kind of absence, so the metric needs no separate measured flag and the report rollup counts `meets` and `misses` straight from it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No status is inferred from a key or unit; a target dropped for a unit mismatch leaves the metric `untargeted` with a `target-unit-mismatch` warning instead of being read as a pass.
 * @evidence contracts/common.md#meaningful-documentation Separates the two compared statuses, the measured but untargeted one and the two value-less ones, and states which other metric fields each status requires.
 */
export type AutoMovieAnalysisMetricStatus =
  | "meets"
  | "misses"
  | "untargeted"
  | "unsupported"
  | "not-run";
