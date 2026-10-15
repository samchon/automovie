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
   *
   * @evidence contracts/common.md#principled-implementation Rebuilds the spline and frame table from the arrays.
   * @evidence contracts/common.md#clear-and-simple-design One call after writing inputs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid inputs are refused.
   * @evidence contracts/common.md#meaningful-documentation States the refusals' source.
   * @evidence contracts/performance.md#efficient-algorithms O(n) plus 64 (n - 1) reflections.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `transportAutoMovieSweepSpine`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `transportAutoMovieSweepSpine`.
   */
  update(): void;

  /**
   * Length of the point polygon, the chord-length scale of `u`.
   *
   * @returns Metres
   *
   * @evidence contracts/common.md#principled-implementation The polygon length, the chord-length scale.
   * @evidence contracts/common.md#clear-and-simple-design One read.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reflects the last update.
   * @evidence contracts/common.md#meaningful-documentation States the unit.
   * @evidence contracts/performance.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `transportAutoMovieSweepSpine`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `transportAutoMovieSweepSpine`.
   */
  length(): number;

  /**
   * Write the curve point at `u`, clamped to `[0, 1]`.
   *
   * @param u Chord-length parameter
   * @param out Receives three numbers
   * @param at Offset into `out`
   *
   * @evidence contracts/common.md#principled-implementation The spline point in Hermite form.
   * @evidence contracts/common.md#clear-and-simple-design Writes into a caller array.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Parameters clamp.
   * @evidence contracts/common.md#meaningful-documentation States the output.
   * @evidence contracts/performance.md#efficient-algorithms A segment search and a cubic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `transportAutoMovieSweepSpine`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `transportAutoMovieSweepSpine`.
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
   * @evidence contracts/common.md#principled-implementation The spline's unit tangent.
   * @evidence contracts/common.md#clear-and-simple-design Writes into a caller array.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A vanishing tangent is refused.
   * @evidence contracts/common.md#meaningful-documentation States the refusal.
   * @evidence contracts/performance.md#efficient-algorithms A segment search and a quadratic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `transportAutoMovieSweepSpine`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `transportAutoMovieSweepSpine`.
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
   * @evidence contracts/common.md#principled-implementation The double-reflection frame from the table.
   * @evidence contracts/common.md#clear-and-simple-design Writes twelve numbers into a caller array.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A transport without frames refuses.
   * @evidence contracts/common.md#meaningful-documentation States the layout and refusal.
   * @evidence contracts/performance.md#efficient-algorithms A segment search and one reflection.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `transportAutoMovieSweepSpine`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `transportAutoMovieSweepSpine`.
   */
  frame(u: number, out: Float64Array, at: number): void;
}
