/**
 * The straight distance between two named skin points of the head view,
 * read on the person's skin at rest
 * (`readHumanLandmarkDistance`), as a sliding caliper reads it.
 *
 * The observed range of the cited source sample is recorded for reporting,
 * not as a bound. A named point or area the head view does not declare
 * refuses the rule by name.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanLandmarkDistanceMeasurement {
  /** Straight distance between two skin points. */
  kind: "landmark-distance";

  /** The head view's skin landmark the distance starts at. */
  from: string;

  /** The head view's skin landmark the distance ends at. */
  to: string;

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
