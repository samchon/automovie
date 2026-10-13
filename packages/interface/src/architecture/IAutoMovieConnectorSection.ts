/** The usable section of a connector at one point along its route. */
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
