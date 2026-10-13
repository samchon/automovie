import { AutoMovieAnalysisComparison } from "./AutoMovieAnalysisComparison";

/**
 * One numeric target the production declares for one metric.
 *
 * The unit is declared beside the value on purpose. A target of `300` against a
 * metric measured in lux and a target of `300` against a metric measured in
 * candela are different requirements, and a contract that carried only the
 * number would let one silently clear the other.
 *
 * A target only ever narrows a verdict; it never widens one. One that cannot be
 * applied, because its unit disagrees with the metric or its key names nothing
 * the study reports, is dropped and said out loud as a run warning rather than
 * quietly satisfied. That is the difference between a rule that was checked and
 * a rule nobody could check, and only the first of them may leave a report
 * reading `meets`.
 *
 * Keys and units are compared as exact strings with no conversion or alias, so
 * a target in `lux` does not apply to a metric in `lx`. A target list is refused
 * before any solver reads it when a key or unit is blank, a value is not
 * finite, a comparison is unknown, or a key repeats.
 *
 * @evidence contracts/common.md#principled-implementation A target applies only when key and unit strings both match a metric exactly; `autoMovieAnalysisMetric` then evaluates the inclusive comparison, and `warnAutoMovieAnalysisTargetKeys` warns for a key that no metric of the study reports.
 * @evidence contracts/common.md#clear-and-simple-design The unit is stored beside the value instead of in a unit registry, so applicability is one string equality and no conversion layer exists to keep in step with solvers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No alias table rescues a near-miss unit, so a mismatched target is dropped with a `target-unit-mismatch` warning, and a target for a metric without a value is left to that metric's gap rather than warned about twice.
 * @evidence contracts/common.md#meaningful-documentation Explains why the unit is declared, exact-string matching, that an inapplicable target is dropped with a warning, and the checks a target list must pass.
 */
export interface IAutoMovieAnalysisTarget {
  /** Metric key this target applies to; unique within the target list. */
  key: string;

  /** Unit symbol the target is stated in, such as `lx`, `s`, `dB`. */
  unit: string;

  /** Finite target value in {@link unit}. */
  value: number;

  /** Whether the metric must reach the value or stay under it. */
  comparison: AutoMovieAnalysisComparison;
}
