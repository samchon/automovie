/**
 * One compiled subject addressed independently from a film-time review target.
 *
 * The shot identifies the compiled artifact that owns the stable subject id. It
 * is not a claim that the subject review observes that shot or its camera.
 *
 * @author Samchon
 */
export interface IAutoMovieSubjectReviewTarget {
  /** Compiled shot artifact that contains the subject. */
  shot: string;

  /** Stable namespaced subject id inside the compiled artifact. */
  subject: string;
}
