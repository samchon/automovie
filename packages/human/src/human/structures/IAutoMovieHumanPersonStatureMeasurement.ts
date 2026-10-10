/**
 * The person's stature: the standing floor-to-vertex height of the closed
 * skin at rest (`readHumanPersonRest`). The observed range of the cited
 * source sample is recorded for reporting, not as a bound.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonStatureMeasurement {
  /** The standing floor-to-vertex height at rest. */
  kind: "stature";

  /** Smallest value the cited source sample observed, metres. */
  sampleMinimumMetres: number;

  /** Largest value the cited source sample observed, metres. */
  sampleMaximumMetres: number;
}
