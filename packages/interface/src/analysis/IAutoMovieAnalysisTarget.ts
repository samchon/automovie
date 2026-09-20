import { AutoMovieAnalysisComparison } from "./AutoMovieAnalysisComparison";

/**
 * One numeric target the production declares for one metric.
 *
 * The unit is declared beside the value on purpose. A target of `300` against a
 * metric measured in lux and a target of `300` against a metric measured in
 * candela are different requirements, and a contract that carried only the
 * number would let one silently clear the other.
 *
 * A target only ever narrows a verdict; it never widens one. One that cannot be
 * applied, because its unit disagrees with the metric or its key names nothing
 * the study reports, is dropped and said out loud as a run warning rather than
 * quietly satisfied. That is the difference between a rule that was checked and
 * a rule nobody could check, and only the first of them may leave a report
 * reading `meets`.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `IAutoMovieAnalysisTarget` as the portable data boundary for the diagnostics failed not run requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `IAutoMovieAnalysisTarget` for the validation failed not run states system contract.
 */
export interface IAutoMovieAnalysisTarget {
  /**
   * Metric key this target applies to.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `key` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `key` for the validation failed not run states system contract.
   */
  key: string;

  /**
   * Unit symbol the target is stated in, such as `lx`, `s`, `dB`.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `unit` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `unit` for the validation failed not run states system contract.
   */
  unit: string;

  /**
   * Finite target value in {@link unit}.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `value` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `value` for the validation failed not run states system contract.
   */
  value: number;

  /**
   * Whether the metric must reach the value or stay under it.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `comparison` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `comparison` for the validation failed not run states system contract.
   */
  comparison: AutoMovieAnalysisComparison;
}
