/**
 * Reusable spine transport with writable control arrays and packed point,
 * tangent and frame queries.
 *
 * Write the full authored arrays and update before the first query or after any
 * edit. Query output belongs to the supplied array. Use numeric chord
 * parameters with a defined normalized value.
 */
export interface IAutoMovieSweepTransport {
  /** Number of control points fixed when storage is created. */
  count: number;

  /** Writable packed metre XYZ controls, three per point in spine order. */
  points: Float64Array;

  /**
   * Writable XYZ direction used to seed the first section axis after projection
   * perpendicular to the starting tangent.
   */
  normal: Float64Array;

  /**
   * Writable XYZ departure direction. An all-zero sentinel uses the spline's
   * first derivative direction.
   */
  start: Float64Array;

  /**
   * Writable XYZ arrival direction. An all-zero sentinel uses the spline's last
   * derivative direction.
   */
  end: Float64Array;

  /**
   * Recompile the path and optional frame table from the current control
   * buffers.
   *
   * @throws Error for unsupported spine geometry, including coincident adjacent
   *   controls, a reversal or unavailable frame tangent.
   */
  update(): void;

  /**
   * Return the current control-polygon length in metres, used to scale the
   * normalized chord coordinate.
   *
   * @returns Current control-polygon length in metres.
   */
  length(): number;

  /**
   * Write three model-metre scalars of the compiled spine point at the clamped
   * chord parameter.
   *
   * @param u Normalized chord coordinate, clamped to [0, 1].
   * @param out Borrowed destination with three writable scalars from at.
   * @param at Scalar starting offset in out.
   */
  point(u: number, out: Float64Array, at: number): void;

  /**
   * Write the unit tangent in increasing chord-parameter direction. A vanishing
   * derivative throws.
   *
   * @param u Normalized chord coordinate, clamped to [0, 1].
   * @param out Borrowed destination with three writable scalars from at.
   * @param at Scalar starting offset in out.
   * @throws Error when the tangent vanishes.
   */
  tangent(u: number, out: Float64Array, at: number): void;

  /**
   * Write twelve scalars as origin, first axis, second axis and normal. Frame
   * queries require transport compiled with frames.
   *
   * @param u Normalized chord coordinate, clamped to [0, 1].
   * @param out Borrowed destination with twelve writable scalars from at.
   * @param at Scalar starting offset in out.
   * @throws Error when the transport carries no frame table.
   */
  frame(u: number, out: Float64Array, at: number): void;
}
