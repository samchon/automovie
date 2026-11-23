/**
 * A spine compiled into buffers that can be rewritten and recompiled in
 * place, from `transportAutoMovieSweepSpine`.
 *
 * The caller writes the points, the starting direction and any end tangents
 * into the arrays, calls `update`, then queries. Queries write into a caller
 * array at an offset and allocate nothing, so a sweep riding a skeleton is
 * re-transported every frame into the same memory. `frameAutoMovieSweepSpine`
 * wraps one of these in the object-returning `IAutoMovieSweepPath`.
 *
 * @evidence contracts/development/design.md#principled-representation Inputs, compiled tables and queries of one spine in caller-visible typed arrays, the standard form of an allocation-free per-frame evaluator.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three input arrays, one recompile and four queries; everything the spine computes lives behind them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Queries before a successful `update` read stale or zero tables; `update` refuses invalid input, as `frameAutoMovieSweepSpine` documents.
 * @evidence contracts/development/common.md#meaningful-documentation States the call order, the output layout and why the buffers exist.
 */
export interface IAutoMovieSweepTransport {
  /** Number of spine points. */
  count: number;

  /** Packed points `[x, y, z, ...]`, metres, `3 * count` numbers, written by the caller. */
  points: Float64Array;

  /** Direction of the section plane's first axis at the start, three numbers. */
  normal: Float64Array;

  /** Direction the path leaves its first point along, three numbers; all zero, the spline's own. */
  start: Float64Array;

  /** Direction the path reaches its last point along, three numbers; all zero, the spline's own. */
  end: Float64Array;

  /**
   * Recompile the curve and, when the transport carries frames, the frame table from the arrays.
   *
   * @throws Error as `frameAutoMovieSweepSpine` documents
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the refusals' source.
   */
  update(): void;

  /**
   * Length of the point polygon, the chord-length scale of `u`.
   *
   * @returns Metres
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit.
   */
  length(): number;

  /**
   * Write the curve point at `u`, clamped to `[0, 1]`.
   *
   * @param u Chord-length parameter
   * @param out Receives three numbers
   * @param at Offset into `out`
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the output.
   */
  point(u: number, out: Float64Array, at: number): void;

  /**
   * Write the unit tangent at `u`.
   *
   * @param u Chord-length parameter
   * @param out Receives three numbers
   * @param at Offset into `out`
   * @throws Error when the tangent vanishes there
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the refusal.
   */
  tangent(u: number, out: Float64Array, at: number): void;

  /**
   * Write the rotation-minimizing frame at `u`: origin, first axis, second axis and normal, twelve numbers.
   *
   * @param u Chord-length parameter
   * @param out Receives twelve numbers
   * @param at Offset into `out`
   * @throws Error when the transport was created without frames
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the layout and refusal.
   */
  frame(u: number, out: Float64Array, at: number): void;
}
