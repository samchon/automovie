/** One addressed shot event with its realized local and mapped story times. */
export interface IAutoMovieStorySyncPoint {
  /** Owning shot id. */
  shot: string;

  /** Exact event id. */
  event: string;

  /**
   * Supplied realized shot-local time in seconds, or null when absent or
   * nonfinite. The Engine evaluator reads its host-provided realization
   * callback; the production adapter is retired.
   */
  localSeconds: number | null;

  /**
   * Story-clock time in seconds, or null when the local time or pin is
   * unavailable or the affine result is nonfinite, including overflow.
   */
  storySeconds: number | null;
}
