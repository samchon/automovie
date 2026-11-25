import type { IAutoMovieInteractionEvent } from "../cinematics/IAutoMovieInteractionEvent";

/**
 * A shot-local interaction event placed on the sequence output clock.
 *
 * `sequenceEventTimeline` emits one per play of an event inside an entry's
 * trimmed range, so a source event replayed by two entries appears twice, and
 * orders them by `globalTime`, then `entry`, then event id. The inherited
 * fields, `time` included, are copied from the shot's event unchanged.
 */
export interface IAutoMoviePlaybackEvent extends IAutoMovieInteractionEvent {
  /** Index of the playing entry in `sequence.shots`. */
  entry: number;

  /** Id of the shot that owns the source event. */
  shot: string;

  /** Shot-local seconds of the source event, equal to the inherited `time`. */
  shotTime: number;

  /**
   * Output seconds at which this play shows the event, after trims, rate
   * changes and transitions.
   */
  globalTime: number;
}
