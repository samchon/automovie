/**
 * One compiled subject addressed independently from a film-time review target.
 *
 * The shot qualifies the compiled artifact that owns the subject; inspection
 * uses its own viewpoint rather than that shot's film camera.
 */
export interface IAutoMovieSubjectReviewTarget {
  /** Compiled shot artifact that contains the subject. */
  shot: string;

  /** Stable namespaced subject id inside the compiled artifact. */
  subject: string;
}
