/**
 * The usable section of a connector at one point along its route.
 *
 * A connector states either a constant `width` and `clearHeight` or a list of
 * these stations, never both and never neither. The list holds at least two
 * stations, starts at `at = 0`, ends at `at = 1`, and strictly increases, and a
 * point between two stations reads their linear interpolation.
 *
 * @evidence contracts/common.md#principled-implementation Samples width and clear height at arc-length fractions and interpolates linearly between adjacent stations in `builtConnectorSection`, which assumes the passage changes shape monotonically between stations; a pinch or bulge between two stations cannot be expressed without another station.
 * @evidence contracts/common.md#clear-and-simple-design Three numbers per station; the list is the varying alternative to the connector's constant pair, and validation refuses a connector carrying both spellings or neither.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No station value is special-cased; the fixed `0` and `1` endpoints are the contract's own rule so every route point has a section on both sides, and stations that repeat or go backwards are refused.
 * @evidence contracts/common.md#meaningful-documentation States the arc-length frame of `at` and why it beats point index, the metre unit and positivity of both extents, the endpoint and ordering rules, and the linear reading between stations.
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
