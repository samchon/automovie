/** One realized shot event placed on the production story clock. */
export interface IAutoMovieStorySyncPoint {
  /** Owning shot id. */
  shot: string;

  /** Exact event id. */
  event: string;

  /**
   * Compiler-realized shot-local time in seconds, or null when the owning shot
   * has no current realization for the event.
   */
  localSeconds: number | null;

  /**
   * Story-clock time in seconds, or null when the local time is unavailable or
   * the owning shot carries no story-clock pin.
   */
  storySeconds: number | null;
}
