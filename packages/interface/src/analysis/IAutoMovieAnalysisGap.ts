import { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";

/**
 * One place a required answer is missing, at whatever granularity it is missing
 * at.
 *
 * A whole run may be unsupported, one metric inside a solved run may be, or a
 * required domain may have no run at all. All three are the same fact to a
 * reader deciding whether the design has been checked, so they are one row
 * shape rather than three lists nobody cross-reads.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `IAutoMovieAnalysisGap` as the portable data boundary for the diagnostics failed not run requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `IAutoMovieAnalysisGap` for the validation failed not run states system contract.
 */
export interface IAutoMovieAnalysisGap {
  /**
   * Run this gap came from, or null when no run answered for the domain.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `run` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `run` for the validation failed not run states system contract.
   */
  run: string | null;
  /**
   * Domain the missing answer belongs to.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `domain` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `domain` for the validation failed not run states system contract.
   */
  domain: AutoMovieAnalysisDomain;
  /**
   * Metric key, or null when the whole run produced nothing.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `metric` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `metric` for the validation failed not run states system contract.
   */
  metric: string | null;
  /**
   * Which kind of nothing this is.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `status` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `status` for the validation failed not run states system contract.
   */
  status: "unsupported" | "not-run";
  /**
   * Non-blank statement of what is missing.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `reason` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `reason` for the validation failed not run states system contract.
   */
  reason: string;
  /**
   * Non-blank statement of the exact change that would fill it.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `remedy` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `remedy` for the validation failed not run states system contract.
   */
  remedy: string;
}
