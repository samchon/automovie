/**
 * Why a metric produced no value, and what would change that.
 *
 * The two fields mirror the render report's analysis gap deliberately: one
 * project should have one way of saying "this was not measured", and a second
 * spelling of the same idea is how two artifacts start disagreeing about what
 * an absent number means.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `IAutoMovieAnalysisMetricGap` as the portable data boundary for the diagnostics failed not run requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `IAutoMovieAnalysisMetricGap` for the validation failed not run states system contract.
 */
export interface IAutoMovieAnalysisMetricGap {
  /**
   * Non-blank statement of what is missing or unimplemented.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `reason` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `reason` for the validation failed not run states system contract.
   */
  reason: string;
  /**
   * Non-blank statement of the exact change that would produce a value.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `remedy` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `remedy` for the validation failed not run states system contract.
   */
  remedy: string;
}
