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
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `IAutoMovieAnalysisMetric` as the portable data boundary for the diagnostics failed not run requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `IAutoMovieAnalysisMetric` for the validation failed not run states system contract.
 */
export interface IAutoMovieAnalysisMetric {
  /**
   * Open metric key such as `workplane.total.illuminance.mean`.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `key` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `key` for the validation failed not run states system contract.
   */
  key: string;

  /**
   * Unit symbol the value is stated in; non-blank even when there is no value.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `unit` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `unit` for the validation failed not run states system contract.
   */
  unit: string;

  /**
   * Finite measured value in {@link unit}, or `null` when none was produced.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `value` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `value` for the validation failed not run states system contract.
   */
  value: number | null;

  /**
   * Declared target in {@link unit}, or `null` when none applies.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `target` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `target` for the validation failed not run states system contract.
   */
  target: number | null;

  /**
   * Direction of {@link target}, or `null` when there is no target.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `comparison` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `comparison` for the validation failed not run states system contract.
   */
  comparison: AutoMovieAnalysisComparison | null;

  /**
   * Outcome for this metric.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `status` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `status` for the validation failed not run states system contract.
   */
  status: AutoMovieAnalysisMetricStatus;

  /**
   * Present exactly when {@link value} is `null`.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `gap` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `gap` for the validation failed not run states system contract.
   */
  gap: IAutoMovieAnalysisMetricGap | null;
}
