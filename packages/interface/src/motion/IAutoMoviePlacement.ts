import type { IAutoMovieMotion } from "./IAutoMovieMotion";

/**
 * A motion clip placed at a start time on an actor's shot timeline.
 * arrangeMotion shifts clip-local keyframes by start and holds the most
 * recently ended clip through gaps; overlap follows that operation's policy.
 */
export interface IAutoMoviePlacement {
  /** Seconds into the shot this clip begins. */
  start: number;

  /** The clip (its own local time starts at 0). */
  motion: IAutoMovieMotion;
}
