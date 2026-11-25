import type { AutoMovieAnalysisComparison } from "./AutoMovieAnalysisComparison";
import type { AutoMovieAnalysisMetricStatus } from "./AutoMovieAnalysisMetricStatus";
import type { IAutoMovieAnalysisMetricGap } from "./IAutoMovieAnalysisMetricGap";

/**
 * One measured quantity, or one explicit gap where a measurement is not.
 *
 * {@link value} is `null` exactly when {@link gap} is present, and zero never
 * stands in for a missing value: zero reverberation and unmeasured
 * reverberation are different facts.
 */
export interface IAutoMovieAnalysisMetric {
  /**
   * Non-blank open metric key such as `workplane.total.illuminance.mean`,
   * unique within its run.
   */
  key: string;

  /** Unit symbol the value is stated in; non-blank even when there is no value. */
  unit: string;

  /** Finite measured value in {@link unit}, or `null` when none was produced. */
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
