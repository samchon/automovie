/**
 * Identity of the solver that produced, or refused, a result.
 *
 * {@link model} states the governing equation in one line. A result whose model
 * is unstated cannot be checked by the reader, and an unstated model is how a
 * placeholder survives review.
 */
export interface IAutoMovieAnalysisSolver {
  /** Stable solver identity such as `automovie.daylight.isotropic-sky`. */
  id: string;

  /** Version that changes whenever the result for the same input changes. */
  version: string;

  /** One-line statement of the governing model and its stated exclusions. */
  model: string;
}
