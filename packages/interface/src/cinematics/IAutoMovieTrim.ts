/**
 * A trim into a shot (seconds), the OpenTimelineIO `source_range` analogue: a
 * start offset and a duration carved out of the shot's local timeline.
 *
 * The span `[start, start + duration]` must lie inside `[0, shot.duration]`.
 *
 * @author Samchon
 */
export interface IAutoMovieTrim {
  /** Seconds into the shot the trim begins; finite and at least `0`. */
  start: number;

  /** Finite positive length of the trimmed span, in seconds. */
  duration: number;
}
