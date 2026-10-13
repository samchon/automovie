import { IAutoMovieMotion } from "@automovie/interface";

/**
 * A motion clip placed at a start time on an actor's shot timeline.
 *
 * @author Samchon
 */
export interface IAutoMoviePlacement {
  /** Seconds into the shot this clip begins. */
  start: number;
  /** The clip (its own local time starts at 0). */
  motion: IAutoMovieMotion;
}
