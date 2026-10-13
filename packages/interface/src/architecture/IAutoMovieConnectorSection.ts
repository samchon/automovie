/**
 * The usable section of a connector at one point along its route.
 *
 * A connector states either a constant `width` and `clearHeight` or a list of
 * these stations, never both and never neither. The list holds at least two
 * stations, starts at `at = 0`, ends at `at = 1`, and strictly increases, and a
 * point between two stations reads their linear interpolation.
 *
 * @author Samchon
 */
export interface IAutoMovieConnectorSection {
  /**
   * Arc-length fraction of the 3D route polyline, `0` at the first point and
   * `1` at the last. Measuring along the route rather than by point index is
   * what keeps a station on an unevenly spaced route where it was put.
   */
  at: number;

  /** Positive usable width in metres here. */
  width: number;

  /** Positive vertical clearance in metres here. */
  clearHeight: number;
}
