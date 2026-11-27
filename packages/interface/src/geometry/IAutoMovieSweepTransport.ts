/**
 * A spine compiled into buffers that can be rewritten and recompiled in place,
 * from `transportSweepSpine`.
 *
 * The caller writes the points, the starting direction and any end tangents
 * into the arrays, calls `update`, then queries. Queries write into a caller
 * array at an offset and allocate nothing, so a sweep riding a skeleton is
 * re-transported every frame into the same memory. `frameSweepSpine`
 * wraps one of these in the object-returning `IAutoMovieSweepPath`.
 */
export interface IAutoMovieSweepTransport {
  /** Number of spine points. */
  count: number;

  /**
   * Packed points `[x, y, z, ...]`, metres, `3 * count` numbers, written by the
   * caller.
   */
  points: Float64Array;

  /** Direction of the section plane's first axis at the start, three numbers. */
  normal: Float64Array;

  /**
   * Direction the path leaves its first point along, three numbers; all zero,
   * the spline's own.
   */
  start: Float64Array;

  /**
   * Direction the path reaches its last point along, three numbers; all zero,
   * the spline's own.
   */
  end: Float64Array;

  /**
   * Recompile the curve and, when the transport carries frames, the frame table
   * from the arrays.
   *
   * @throws Error as `frameSweepSpine` documents
   */
  update(): void;

  /**
   * Length of the point polygon, the chord-length scale of `u`.
   *
   * @returns Metres
   */
  length(): number;

  /**
   * Write the curve point at `u`, clamped to `[0, 1]`.
   *
   * @param u Chord-length parameter
   * @param out Receives three numbers
   * @param at Offset into `out`
   */
  point(u: number, out: Float64Array, at: number): void;

  /**
   * Write the unit tangent at `u`.
   *
   * @param u Chord-length parameter
   * @param out Receives three numbers
   * @param at Offset into `out`
   * @throws Error when the tangent vanishes there
   */
  tangent(u: number, out: Float64Array, at: number): void;

  /**
   * Write the rotation-minimizing frame at `u`: origin, first axis, second axis
   * and normal, twelve numbers.
   *
   * @param u Chord-length parameter
   * @param out Receives twelve numbers
   * @param at Offset into `out`
   * @throws Error when the transport was created without frames
   */
  frame(u: number, out: Float64Array, at: number): void;
}
