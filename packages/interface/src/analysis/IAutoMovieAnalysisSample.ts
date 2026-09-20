import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One value of one metric at one place, for a field overlay.
 *
 * A sample may only carry a key some metric of the same run actually measured.
 * A heatmap of a metric that produced no value would be a picture of a
 * computation nobody ran, which is the exact confusion this contract exists to
 * make impossible.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `IAutoMovieAnalysisSample` as the portable data boundary for the diagnostics failed not run requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `IAutoMovieAnalysisSample` for the validation failed not run states system contract.
 */
export interface IAutoMovieAnalysisSample {
  /**
   * Stable sample identity within the run.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `id` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `id` for the validation failed not run states system contract.
   */
  id: string;

  /**
   * Metric key this sample is a field of.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `key` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `key` for the validation failed not run states system contract.
   */
  key: string;

  /**
   * World position in metres.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `position` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `position` for the validation failed not run states system contract.
   */
  position: IAutoMovieVector3;

  /**
   * Finite value at {@link position}, in the metric's unit.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `value` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `value` for the validation failed not run states system contract.
   */
  value: number;
}
