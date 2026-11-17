/**
 * One sequence entry's placement on the output clock: where it starts globally,
 * how long it plays, and the shot-local second its playback begins at.
 *
 * `sequenceTimeline` produces one per `sequence.shots` entry, in sequence order.
 * For a sequence that passed `cutSequence`, which keeps every transition within
 * the previous entry's played span, starts never decrease, and two adjacent
 * starts are equal only for a transition as long as that span.
 *
 * @evidence contracts/development/design.md#principled-representation `start` is the previous entry's end minus this entry's transition duration and the output span is `[start, start + played)`, so an output second `t` inside it maps to the shot-local second `offset + (t - start)`, the affine map every playback resolver applies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the sequence index beside the shot id because one shot may play in several entries, and the index is what reaches the entry's own transition; the end is derived as `start + played` instead of stored twice.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No entry is special-cased by position or shot: the first entry starts at zero only because it has no transition, which `sequenceTimeline` requires rather than defaulting.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the order and monotonic starts, when two starts coincide, and for each field its clock, unit and the trim-or-whole-shot rule.
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
   * Seconds of the shot this entry plays: its trim's duration, else the whole
   * shot's duration.
   */
  played: number;

  /** Shot-local second playback begins at: the trim's start, else 0. */
  offset: number;
}
