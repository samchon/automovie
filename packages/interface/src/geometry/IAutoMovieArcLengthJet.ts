/**
 * Curve point and derivatives in the chosen increasing millimetre arc-length
 * direction.
 *
 * A planar section and a world-space seam can use different dimensions. Before
 * comparing continuity, establish the common chart, axis direction and source
 * regularity. The zero-speed convention is a numerical diagnostic.
 */
export interface IAutoMovieArcLengthJet {
  /**
   * Published point in millimetres in the shared chart, with the same dimension
   * as the derivative arrays.
   */
  point: number[];

  /**
   * Unit tangent along increasing arc length for a regular curve. A zero source
   * derivative publishes the zero tangent.
   */
  tangent: number[];

  /**
   * Regular second arc-length derivative in inverse millimetres and
   * perpendicular to the tangent. At zero source speed this field retains the
   * source second derivative as a diagnostic value.
   */
  curvature: number[];
}
