/**
 * Reusable section plane compiler whose station rotation buffers can be
 * rewritten for pose updates.
 */
export interface IAutoMovieSweepOrientation {
  /**
   * Writable packed absolute x, y, z, w rotations, four scalars per station.
   * Slots are read when selected by given.
   */
  rotations: Float64Array;

  /**
   * Writable flag per station. Zero keeps the carried frame at that station and
   * one reads its rotation slot.
   */
  given: Uint8Array;

  /**
   * Recompute relative turns after the current spine transport and station
   * rotations have been written.
   */
  update(): void;

  /**
   * Write metre origin, unit first axis, unit second axis and unit normal in
   * that order, three scalars each.
   *
   * @param u Normalized chord coordinate, clamped to [0, 1].
   * @param out Borrowed destination with twelve writable scalars from at.
   * @param at Scalar starting offset in out.
   */
  frame(u: number, out: Float64Array, at: number): void;
}
