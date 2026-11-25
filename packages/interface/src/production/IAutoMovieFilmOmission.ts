/**
 * Auditable disposition for one current shot intentionally excluded from the
 * film. The same shot cannot also appear in the video track or be omitted
 * twice.
 */
export interface IAutoMovieFilmOmission {
  /** Current shot contract intentionally absent from the edit. */
  shot: string;

  /** Auditable non-blank reason. */
  reason: string;
}
