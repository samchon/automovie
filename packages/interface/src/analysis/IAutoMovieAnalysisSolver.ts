/**
 * Identity of the solver that produced, or refused, a result.
 *
 * {@link model} states the governing equation in one line. A result whose model
 * is unstated cannot be checked by the reader, and an unstated model is how a
 * placeholder survives review.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `IAutoMovieAnalysisSolver` as the portable data boundary for the diagnostics derived result finding requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `IAutoMovieAnalysisSolver` for the validation derived result finding system contract.
 */
export interface IAutoMovieAnalysisSolver {
  /**
   * Stable solver identity such as `automovie.daylight.isotropic-sky`.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `id` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `id` for the validation derived result finding system contract.
   */
  id: string;

  /**
   * Version that changes whenever the result for the same input changes.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `version` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `version` for the validation derived result finding system contract.
   */
  version: string;

  /**
   * One-line statement of the governing model and its stated exclusions.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `model` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `model` for the validation derived result finding system contract.
   */
  model: string;
}
