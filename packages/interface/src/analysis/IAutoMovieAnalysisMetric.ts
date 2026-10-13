import { AutoMovieAnalysisComparison } from "./AutoMovieAnalysisComparison";
import { AutoMovieAnalysisMetricStatus } from "./AutoMovieAnalysisMetricStatus";
import { IAutoMovieAnalysisMetricGap } from "./IAutoMovieAnalysisMetricGap";

/**
 * One measured quantity, or one explicit gap where a measurement is not.
 *
 * {@link value} is `null` exactly when {@link gap} is present, and zero never
 * stands in for a missing value: zero reverberation and unmeasured
 * reverberation are different facts.
 *
 * @evidence contracts/common.md#principled-implementation Value, target, comparison, status and gap are partners that `validateAutoMovieAnalysisRun` cross-checks: a null value requires a gap and forbids target and comparison, and `meets` or `misses` must equal the recomputed inclusive comparison.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with nullable members rather than a union of measured and missing arms, because `autoMovieAnalysisRunDigest` serializes every member, gap text included, as one fixed-order JSON tuple per metric.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `autoMovieAnalysisMetric` throws on a value with a gap, on neither, and on a non-finite value, so no producer can substitute zero or `NaN` for a missing measurement.
 * @evidence contracts/common.md#meaningful-documentation States the value-gap invariant, the unit every number is in, when target and comparison are null, the uniqueness of the key, and the status agreement rule.
 * @author Samchon
 */
export interface IAutoMovieAnalysisMetric {
  /**
   * Non-blank open metric key such as `workplane.total.illuminance.mean`,
   * unique within its run.
   */
  key: string;

  /**
   * Unit symbol the value is stated in; non-blank even when there is no value.
   */
  unit: string;

  /**
   * Finite measured value in {@link unit}, or `null` when none was produced.
   */
  value: number | null;

  /**
   * Declared target in {@link unit}, or `null` when none applies, when the
   * declared target used another unit, or when there is no value.
   */
  target: number | null;

  /** Direction of {@link target}, or `null` when there is no target. */
  comparison: AutoMovieAnalysisComparison | null;

  /**
   * Outcome for this metric. `meets` and `misses` must match comparing
   * {@link value} against {@link target} in the {@link comparison} direction.
   */
  status: AutoMovieAnalysisMetricStatus;

  /** Present exactly when {@link value} is `null`. */
  gap: IAutoMovieAnalysisMetricGap | null;
}
