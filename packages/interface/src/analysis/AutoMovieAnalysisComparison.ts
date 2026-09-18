/**
 * Which way a declared target is satisfied.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `AutoMovieAnalysisComparison` as the portable data boundary for the diagnostics failed not run requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `AutoMovieAnalysisComparison` for the validation failed not run states system contract.
 */
export type AutoMovieAnalysisComparison = "at-least" | "at-most";
