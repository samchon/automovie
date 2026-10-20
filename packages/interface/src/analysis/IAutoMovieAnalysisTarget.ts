import { AutoMovieAnalysisComparison } from "./AutoMovieAnalysisComparison";

/**
 * One numeric target the production declares for one metric.
 *
 * The unit is declared beside the value because a target of `300` against a
 * metric in lux and a target of `300` against a metric in candela are different
 * requirements, and a number alone would let one clear the other.
 *
 * A target only narrows a verdict. One that cannot be applied, because its unit
 * disagrees with the metric (`target-unit-mismatch`) or its key names no metric
 * the study reports (`target-key-unknown`), is dropped and reported as a run
 * warning rather than treated as satisfied. A target whose metric produced no
 * value reaches the report as that metric's gap instead.
 *
 * Keys and units are compared as exact strings with no conversion or alias, so
 * a target in `lux` does not apply to a metric in `lx`. A target list is
 * refused before any solver reads it when a key or unit is blank, a value is
 * not finite, a comparison is unknown, or a key repeats.
 *
 * @evidence contracts/common.md#principled-implementation `assertAutoMovieAnalysisTargets` runs inside every solver's request check before computation, and `autoMovieAnalysisMetric` applies the first target with the metric's key only when its unit string equals the metric's unit.
 * @evidence contracts/common.md#clear-and-simple-design Key, unit, value and direction are the whole requirement; no unit table or conversion layer exists, since exact string matching is the stated contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An inapplicable target is never silently passed: a unit mismatch and an unknown key each emit a named warning, and a metric judged against a mismatched target reads `untargeted` rather than `meets`.
 * @evidence contracts/common.md#meaningful-documentation States why the unit is declared, the two warning codes for inapplicable targets, the exact-string matching rule, and every condition that refuses a target list.
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
