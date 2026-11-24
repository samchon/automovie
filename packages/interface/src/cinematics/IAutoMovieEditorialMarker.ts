/**
 * A named point or range on a shot's source clock for editorial or conditioning
 * metadata.
 */
export interface IAutoMovieEditorialMarker {
  /** Id, unique within the owning shot. */
  id: string;

  /** Nonblank label copied to every retained play. */
  label: string;

  /** Start in shot-local seconds, in `[0, duration)`. */
  startSeconds: number;

  /**
   * End in shot-local seconds, in `[startSeconds, duration]`. Equal to start
   * for a point.
   */
  endSeconds: number;
}
