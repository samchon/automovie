/**
 * A sweep's section planes compiled into buffers that a pose can rewrite,
 * from `orientAutoMovieSweep`.
 *
 * The caller writes each station's plane rotation and whether it gives one,
 * calls `update` after the spine's transport is current, then reads frames
 * into its own arrays without allocation.
 *
 * @evidence contracts/common.md#principled-implementation The station rotations of a sweep held as relative turns over the carried frame, the representation that interpolates between key sections.
 * @evidence contracts/common.md#clear-and-simple-design Two input arrays, one recompile and one query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `update` reads the transport as it is; a stale transport gives stale frames, so callers update the transport first.
 * @evidence contracts/common.md#meaningful-documentation States the call order and what each array holds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are on `orientAutoMovieSweep`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record; it is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record whose arrays its producer sizes.
 * @author Samchon
 */
export interface IAutoMovieSweepOrientation {
  /** Each station's plane rotation `[x, y, z, w]` in the model frame, four numbers per station, read where `given` is 1. */
  rotations: Float64Array;

  /** 1 for a station that gives a rotation, 0 for one whose plane is the carried frame. */
  given: Uint8Array;

  /** Recompute every station's turn relative to the carried frame at its `at`. */
  update(): void;

  /**
   * Write the section plane at `u`: origin, first axis, second axis and normal, twelve numbers.
   *
   * @param u Chord-length parameter, clamped to `[0, 1]`
   * @param out Receives twelve numbers
   * @param at Offset into `out`
   */
  frame(u: number, out: Float64Array, at: number): void;
}
