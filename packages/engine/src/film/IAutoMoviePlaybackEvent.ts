import { IAutoMovieInteractionEvent } from "@automovie/interface";

/**
 * A shot-local interaction event placed on the sequence output clock.
 *
 * `sequenceEventTimeline` emits one per play of an event inside an entry's
 * trimmed range, so a source event replayed by two entries appears twice, and
 * orders them by `globalTime`, then `entry`, then event id. The inherited
 * fields, `time` included, are copied from the shot's event unchanged.
 *
 * @evidence contracts/development/design.md#principled-representation `globalTime` is `entry.start + (event.time - entry.offset)`, the same affine map a playback sample uses, and an event exactly on a contiguous trim seam is assigned to one entry by the half-open range rule `sequenceEventTimeline` documents, so it is placed once per on-screen instant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Extends the interaction event instead of wrapping it, so a consumer reads kind, actor and point directly, and adds only the placement: the entry index, its shot, and both clocks. `shotTime` repeats the inherited `time`; it is kept as the explicit name beside `globalTime` in the published shape, and removing it would change that public type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No event kind or source is special-cased in placement, and an event outside a play's trimmed range is omitted rather than clamped onto its edge.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the per-play emission, the ordering, that inherited fields are unchanged, and for each added field its clock and meaning.
 */
export interface IAutoMoviePlaybackEvent extends IAutoMovieInteractionEvent {
  /** Index of the playing entry in `sequence.shots`. */
  entry: number;

  /** Id of the shot that owns the source event. */
  shot: string;

  /** Shot-local seconds of the source event, equal to the inherited `time`. */
  shotTime: number;

  /**
   * Output seconds at which this play shows the event, after trims and
   * transitions.
   */
  globalTime: number;
}
