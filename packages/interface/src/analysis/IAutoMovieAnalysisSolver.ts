/**
 * Identity of the solver that produced, or refused, a result.
 *
 * {@link model} states the governing equation in one line, because a reader
 * cannot check a result whose model is unstated.
 *
 * All three fields must be non-blank, and all three are part of the run digest.
 *
 * @evidence contracts/common.md#principled-implementation Identity, version and a one-line governing model are free strings that `validateAutoMovieAnalysisRun` requires to be non-blank and that the run digest joins in fixed order, so changing any of them changes the sealed run.
 * @evidence contracts/common.md#clear-and-simple-design Three strings and no parameter list; what the solver was configured with travels separately as the run's settings digest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing parses the model text or treats a solver id specially in validation or reporting; the accuracy of the stated model rests on the solver that writes it, such as `automovie.envelope.steady-state-1d`.
 * @evidence contracts/common.md#meaningful-documentation States why the model must be stated, when the version must change, that all three fields are non-blank and digested, and an example identity.
 */
export interface IAutoMovieAnalysisSolver {
  /** Stable solver identity such as `automovie.daylight.isotropic-sky`. */
  id: string;

  /** Version that changes whenever the result for the same input changes. */
  version: string;

  /** One-line statement of the governing model and its stated exclusions. */
  model: string;
}
