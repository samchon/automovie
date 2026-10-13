/**
 * Identity of the solver that produced, or refused, a result.
 *
 * {@link model} states the governing equation in one line. A result whose model
 * is unstated cannot be checked by the reader, and an unstated model is how a
 * placeholder survives review.
 *
 * All three fields must be non-blank, and all three are part of the run digest.
 *
 * @evidence contracts/common.md#principled-implementation Identity, version and a one-line governing model are free strings folded into the run digest, so restating the model or bumping the version yields a different sealed run for the same outcome.
 * @evidence contracts/common.md#clear-and-simple-design Three strings with no structured parameter list; what the solver was configured with travels separately as the run's settings digest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validation only checks the strings for non-blankness and nothing parses the model text, so its accuracy rests on the solver that writes it; no solver id is treated specially by validation or reporting.
 * @evidence contracts/common.md#meaningful-documentation States why the model must be stated, that the version changes whenever output for the same input changes, and that all three fields are non-blank and digested.
 */
export interface IAutoMovieAnalysisSolver {
  /** Stable solver identity such as `automovie.daylight.isotropic-sky`. */
  id: string;

  /** Version that changes whenever the result for the same input changes. */
  version: string;

  /** One-line statement of the governing model and its stated exclusions. */
  model: string;
}
