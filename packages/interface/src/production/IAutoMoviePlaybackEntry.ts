/**
 * One sequence entry's placement on the output clock: where it starts globally,
 * how long it plays, and the shot-local second its playback begins at.
 *
 * `sequenceTimeline` produces one per `sequence.shots` entry, in sequence
 * order. For a sequence that passed `cutSequence`, which keeps every transition
 * within the previous entry's played span, starts never decrease, and two
 * adjacent starts are equal only for a transition as long as that span.
 */
export interface IAutoMoviePlaybackEntry {
  /** Index of this entry in `sequence.shots`. */
  entry: number;

  /** Id of the shot this entry plays. */
  shot: string;

  /**
   * Output second this entry starts at, overlapping the previous entry's tail
   * by this entry's transition duration.
   */
  start: number;

  /**
   * Output seconds this entry occupies: the retained source duration divided by
   * the playback rate.
   */
  played: number;

  /** Shot-local second playback begins at: the trim's start, else 0. */
  offset: number;

  /** Source seconds per output second. Absent at the default 1× rate. */
  playbackRate?: number;
}
