/**
 * The usable section of a connector at one point along its route.
 *
 * A connector states either a constant `width` and `clearHeight` or a list of
 * these stations, never both and never neither. The list holds at least two
 * stations, starts at `at = 0`, ends at `at = 1`, and strictly increases, and a
 * point between two stations reads their linear interpolation.
 *
 * @evidence contracts/common.md#principled-implementation A varying section is a piecewise-linear function of arc-length fraction, read by `builtConnectorSection` between the two stations bracketing the queried fraction; anchoring stations at both ends guarantees every fraction in `[0, 1]` has a bracket.
 * @evidence contracts/common.md#clear-and-simple-design One station is a fraction and the two usable dimensions, and the list is the only spelling of a varying passage, so a constant passage keeps its two scalar fields on the connector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both or neither spellings are refused rather than one being preferred, and an unanchored or non-increasing station list is refused instead of being sorted or clamped.
 * @evidence contracts/common.md#meaningful-documentation States the either-or spelling rule, the list's anchoring, length and ordering rules, the interpolation between stations, the arc-length meaning of `at`, and the metre units and positivity of both dimensions.
 */
export interface IAutoMovieConnectorSection {
  /**
   * Arc-length fraction of the 3D route polyline, `0` at the first point and
   * `1` at the last. Measuring along the route rather than by point index
   * keeps a station on an unevenly spaced route where it was put.
   */
  at: number;

  /** Positive usable width in metres here. */
  width: number;

  /** Positive vertical clearance in metres here. */
  clearHeight: number;
}
