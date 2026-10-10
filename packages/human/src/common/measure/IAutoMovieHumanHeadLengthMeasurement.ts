/**
 * The distance from a named glabella to the opisthocranion, read on the
 * person's skin at rest (`readHumanHeadLength`). The opisthocranion
 * is the point of the head view's midsagittal section (the plane through the
 * glabella normal to +X) farthest from the glabella, among the points at or
 * above a named tragion's height (`findHumanOpisthocranion`).
 *
 * The observed range of the cited source sample is recorded for reporting,
 * not as a bound. A named point or area the head view does not declare
 * refuses the rule by name.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadLengthMeasurement {
  /** Glabella to the farthest midsagittal point of the back of the head. */
  kind: "head-length";

  /** The head view's skin landmark the length starts at. */
  glabella: string;

  /** The head view's skin landmark whose height bounds the opisthocranion search from below. */
  tragion: string;

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
