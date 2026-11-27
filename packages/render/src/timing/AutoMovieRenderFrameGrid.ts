/**
 * Zero-based, regularly spaced presentation frames followed by the exact end.
 * Takes and preview controls share the grid, including an endpoint that falls
 * between regular frame times.
 */
export namespace AutoMovieRenderFrameGrid {
  /**
   * Find the final zero-based frame number for a nonnegative duration in
   * seconds and a positive rate in frames per second. The exact end takes the
   * place of the first regular frame at or past the end.
   */
  export function last(duration: number, fps: number): number {
    const nearest: number = Math.round(duration * fps);
    return nearest / fps < duration ? nearest + 1 : nearest;
  }

  /**
   * Read a zero-based frame's timestamp in seconds at the given rate in frames
   * per second, clamped to the final timestamp, `duration`.
   */
  export function time(frame: number, duration: number, fps: number): number {
    return Math.min(frame / fps, duration);
  }

  /**
   * Show the closest regular frame for an in-range second, reserving the final
   * frame for the exact end. The caller supplies the duration in seconds, the
   * rate in frames per second, and the already computed last frame number.
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
