/**
 * Identity of the solver that produced, or refused, a result.
 *
 * {@link model} states the governing equation in one line, because a reader
 * cannot check a result whose model is unstated.
 *
 * All three fields must be non-blank, and all three are part of the run digest.
 */
export interface IAutoMovieAnalysisSolver {
  /** Stable solver identity such as `automovie.daylight.isotropic-sky`. */
  id: string;

  /** Version that changes whenever the result for the same input changes. */
  version: string;

  /** One-line statement of the governing model and its stated exclusions. */
  model: string;
}
