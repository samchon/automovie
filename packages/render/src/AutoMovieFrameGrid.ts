/**
 * Zero-based, regularly spaced presentation frames followed by the exact end.
 * Takes and preview controls share the grid, including an endpoint that falls
 * between regular frame times.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the index origin, temporal spacing, endpoint, and consumers.
 * @evidence contracts/development/design.md#principled-representation Frame indices are zero-based integers, timestamps and duration are seconds, and cadence is positive frames per second. JavaScript numbers do not enforce these constraints, so the caller supplies a valid presentation clock and index.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Render owns frame schedules. The take producer reads the last index and frame times, and the preview controls also map a playhead second to a displayed frame index.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The endpoint rule works for both exact-grid and fractional durations and requires no caller-specific mode.
 */
export namespace AutoMovieFrameGrid {
  /**
   * Find the final zero-based frame number for a nonnegative duration in
   * seconds and a positive rate in frames per second. The exact end takes
   * the place of the first regular frame at or past the end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the units, index origin, and the final frame's relation to the regular cadence.
   * @evidence contracts/development/implementation.md#principled-implementation Compares the candidate's canonical timestamp to the end since the product alone can round across an integer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Computes one candidate, then advances it if its timestamp is still before the end.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps a fractional end distinct from the regular frame immediately before it without an arbitrary epsilon.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and space.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Computes one candidate and its time.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state.
   */
  export function last(duration: number, fps: number): number {
    const nearest: number = Math.round(duration * fps);
    return nearest / fps < duration ? nearest + 1 : nearest;
  }

  /**
   * Read a zero-based frame's timestamp in seconds at the given rate in
   * frames per second, clamped to the final timestamp, `duration`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the index origin, input and return units, and the end clamp.
   * @evidence contracts/development/implementation.md#principled-implementation One division yields the canonical timestamp without accumulating rounding error.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Divides the index by the rate and clamps the result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Returns the exact end when the next regular frame would run past it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and space.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Computes one timestamp.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state.
   */
  export function time(frame: number, duration: number, fps: number): number {
    return Math.min(frame / fps, duration);
  }

  /**
   * Show the closest regular frame for an in-range second, reserving the
   * final frame for the exact end. The caller supplies the duration in
   * seconds, the rate in frames per second, and the already computed last
   * frame number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the rounding policy, the exact end, and the units of the supplied clock.
   * @evidence contracts/development/implementation.md#principled-implementation Rounds within the regular grid and reserves the end index for the actual end, so it remains a separate scrubber position.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns the last index at the end and otherwise rounds and caps the regular index.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A playhead just before the end cannot occupy the end index.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the last frame number already computed for the grid.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state.
   */
  export function nearest(
    seconds: number,
    duration: number,
    fps: number,
    last: number,
  ): number {
    return seconds >= duration
      ? last
      : Math.min(last - 1, Math.round(seconds * fps));
  }
}
