/**
 * One entry's placement on the output timeline: where it starts globally, how
 * long it plays (its trim, else the whole shot), and the shot-local second its
 * playback begins at.
 *
 * @author Samchon
 */
export interface IAutoMoviePlaybackEntry {
  /** Index into `sequence.shots`. */
  entry: number;

  /** Shot id played here. */
  shot: string;

  /** Global output second this entry starts at. */
  start: number;

  /** Seconds of the shot this entry plays. */
  played: number;

  /** Shot-local second playback begins at (the trim's start, else 0). */
  offset: number;
}
