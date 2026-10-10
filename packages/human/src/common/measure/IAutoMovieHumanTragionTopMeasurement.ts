/**
 * The vertical distance from a named tragion to the top of the head view
 * skin, read on the person's skin at rest (`readHumanTragionTop`).
 * The top is the highest head view vertex: on a triangle mesh the highest
 * point is a vertex.
 *
 * The observed range of the cited source sample is recorded for reporting,
 * not as a bound. A named point or area the head view does not declare
 * refuses the rule by name.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanTragionTopMeasurement {
  /** Tragion to the top of the head, vertically. */
  kind: "tragion-top";

  /** The head view's skin landmark the height is taken from. */
  tragion: string;

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
