/**
 * A canonical source sample's ordered chart: the three original source
 * vertices it is read over and its dimensionless [u, v] coordinates, meaning
 * originals[0] + u (originals[1] - originals[0]) + v (originals[2] - originals[0]).
 * An original vertex repeats itself at [0, 0]; a cut point uses [t, 0].
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceChart {
  /** Ordered original source vertex IDs of the chart's corners. */
  originals: readonly [number, number, number];

  /** Dimensionless [u, v] coordinates over those corners. */
  coordinates: readonly [number, number];
}
