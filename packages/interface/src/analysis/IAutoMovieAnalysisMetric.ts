import { AutoMovieAnalysisComparison } from "./AutoMovieAnalysisComparison";
import { AutoMovieAnalysisMetricStatus } from "./AutoMovieAnalysisMetricStatus";
import { IAutoMovieAnalysisMetricGap } from "./IAutoMovieAnalysisMetricGap";

/**
 * One measured quantity, or one honest hole where a measurement is not.
 *
 * {@link value} is `null` exactly when {@link gap} is present, and never zero as
 * a stand-in. Zero reverberation and unmeasured reverberation are different
 * facts, and only one of them is a room.
 */
export interface IAutoMovieAnalysisMetric {
  /** Open metric key such as `workplane.total.illuminance.mean`. */
  key: string;

  /**
   * Unit symbol the value is stated in; non-blank even when there is no value.
   */
  unit: string;

  /**
   * Finite measured value in {@link unit}, or `null` when none was produced.
   */
  value: number | null;

  /** Declared target in {@link unit}, or `null` when none applies. */
  target: number | null;

  /** Direction of {@link target}, or `null` when there is no target. */
  comparison: AutoMovieAnalysisComparison | null;

  /** Outcome for this metric. */
  status: AutoMovieAnalysisMetricStatus;

  /** Present exactly when {@link value} is `null`. */
  gap: IAutoMovieAnalysisMetricGap | null;
}
