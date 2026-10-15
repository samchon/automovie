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
 * @evidence contracts/common.md#principled-implementation Inputs, compiled tables and queries of one spine in caller-visible typed arrays, the standard form of an allocation-free per-frame evaluator.
 * @evidence contracts/common.md#clear-and-simple-design Three input arrays, one recompile and four queries; everything the spine computes lives behind them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Queries before a successful `update` read stale or zero tables; `update` refuses invalid input, as `frameAutoMovieSweepSpine` documents.
 * @evidence contracts/common.md#meaningful-documentation States the call order, the output layout and why the buffers exist.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are answered on `transportAutoMovieSweepSpine`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record; it is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record whose arrays its producer sizes.
 * @author Samchon
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
   * Write the rotation-minimizing frame at `u`: origin, first axis, second axis and normal, twelve numbers.
   *
   * @param u Chord-length parameter
   * @param out Receives twelve numbers
   * @param at Offset into `out`
   * @throws Error when the transport was created without frames
   */
  frame(u: number, out: Float64Array, at: number): void;
}
