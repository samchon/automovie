/** Explicit narrative-shot omission disposition. */
export interface IAutoMovieFilmOmission {
  /** Current shot contract intentionally absent from the edit. */
  shot: string;

  /** Auditable non-blank reason. */
  reason: string;
}
