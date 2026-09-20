/**
 * Something the solver noticed that does not invalidate the result.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `IAutoMovieAnalysisWarning` as the portable data boundary for the diagnostics failed not run requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `IAutoMovieAnalysisWarning` for the validation failed not run states system contract.
 */
export interface IAutoMovieAnalysisWarning {
  /**
   * Stable warning code such as `target-unit-mismatch`.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `code` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `code` for the validation failed not run states system contract.
   */
  code: string;

  /**
   * Non-blank human-readable detail.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `detail` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `detail` for the validation failed not run states system contract.
   */
  detail: string;

  /**
   * Input the warning is about, or null when it is about the run.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `subject` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `subject` for the validation failed not run states system contract.
   */
  subject: string | null;
}
