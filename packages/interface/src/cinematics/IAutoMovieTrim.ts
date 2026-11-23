/**
 * A trim into a shot in seconds, the OpenTimelineIO `source_range` analogue: a
 * start offset and a duration carved out of the shot's local timeline.
 *
 * `cutSequence` refuses a trim whose span `[start, start + duration]` leaves
 * `[0, shot.duration]`.
 */
export interface IAutoMovieTrim {
  /** Shot-local seconds where the trim begins; finite and at least `0`. */
  start: number;

  /** Finite positive length of the trimmed span, in seconds. */
  duration: number;
}
