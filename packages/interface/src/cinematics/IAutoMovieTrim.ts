/**
 * A trim into a shot (seconds), the OpenTimelineIO `source_range` analogue: a
 * start offset and a duration carved out of the shot's local timeline.
 *
 * The span `[start, start + duration]` must lie inside `[0, shot.duration]`.
 *
 * @evidence contracts/common.md#principled-implementation Carves `[start, start + duration]` from the shot's local clock as OpenTimelineIO's `source_range` does; `cutSequence` requires a finite start, a finite positive duration, and the span inside the shot.
 * @evidence contracts/common.md#clear-and-simple-design Stores start plus duration rather than start plus end, so the played length that `sequenceTimeline` sums and the source offset it plays from are both read directly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An out-of-range trim is refused with its overshoot reported, never shortened to fit the shot.
 * @evidence contracts/common.md#meaningful-documentation Documents seconds, the shot-local origin, and that the carved span must lie inside the shot.
 * @author Samchon
 */
export interface IAutoMovieTrim {
  /** Seconds into the shot the trim begins; finite and at least `0`. */
  start: number;

  /** Finite positive length of the trimmed span, in seconds. */
  duration: number;
}
