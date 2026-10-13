import { AutoMovieAnalysisComparison } from "./AutoMovieAnalysisComparison";
import { AutoMovieAnalysisMetricStatus } from "./AutoMovieAnalysisMetricStatus";
import { IAutoMovieAnalysisMetricGap } from "./IAutoMovieAnalysisMetricGap";

/**
 * One measured quantity, or one honest hole where a measurement is not.
 *
 * {@link value} is `null` exactly when {@link gap} is present, and never zero as
 * a stand-in. Zero reverberation and unmeasured reverberation are different
 * facts, and only one of them is a room.
 *
 * @evidence contracts/common.md#principled-implementation Value and gap are mutually exclusive, enforced in `validateAutoMovieAnalysisRun`: a null value requires a non-blank gap, a value-less status and no target or comparison, while a finite value forbids a gap.
 * @evidence contracts/common.md#clear-and-simple-design The matching production target and its direction are copied onto the metric so a reader can recheck the verdict from the run alone, without the request that produced it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero is never a stand-in for a missing value, and a target whose unit string differs from the metric's is dropped by `autoMovieAnalysisMetric` with a warning instead of being converted or compared.
 * @evidence contracts/common.md#meaningful-documentation States value and gap exclusivity, that value and target share the metric unit, key uniqueness within a run, and the rule tying status to the comparison arithmetic.
 */
export interface IAutoMovieAnalysisMetric {
  /**
   * Open metric key such as `workplane.total.illuminance.mean`, unique within
   * its run.
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
