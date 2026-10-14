/**
 * How one metric came out.
 *
 * `meets` and `misses` are the only two that mean a number was produced and
 * compared. `untargeted` means a number exists but no target applied to it.
 * `unsupported` and `not-run` mean there is no number at all, and the metric
 * carries the reason in its gap instead.
 *
 * Run validation ties the status to the metric's other fields: `meets` and
 * `misses` must agree with the value compared against the target in its
 * direction, `untargeted` carries neither target nor comparison, and the two
 * value-less statuses require a gap.
 *
 * @evidence contracts/common.md#principled-implementation Five closed literals split into valued and value-less families; `validateAutoMovieAnalysisRun` recomputes `meets` or `misses` from value, target and comparison and refuses a status from the wrong family for the value present.
 * @evidence contracts/common.md#clear-and-simple-design One status field replaces separate measured and passed flags; the surrounding metric remains a flat nullable record, so validation rather than this union rejects combinations such as a missed metric without a value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A target dropped for a unit mismatch yields `untargeted` plus a warning rather than a fabricated `meets`, and a value-less metric can never take a passing status.
 * @evidence contracts/common.md#meaningful-documentation Gives which statuses carry a number, what `untargeted` means, where a missing value's reason lives, and the field agreement validation enforces.
 * @author Samchon
 */
export type AutoMovieAnalysisMetricStatus =
  | "meets"
  | "misses"
  | "untargeted"
  | "unsupported"
  | "not-run";
