/**
 * A trim into a shot in seconds, the OpenTimelineIO `source_range` analogue: a
 * start offset and a duration carved out of the shot's local timeline.
 *
 * `cutSequence` refuses a trim whose span `[start, start + duration]` leaves
 * `[0, shot.duration]`.
 *
 * @evidence contracts/common.md#principled-implementation `cutSequence` checks a finite positive duration, a finite start, and `start >= 0` with `start + duration <= shot.duration`, then `sequenceTimeline` plays the entry for `duration` seconds starting at shot-local `start`.
 * @evidence contracts/common.md#clear-and-simple-design A start and a duration rather than two endpoints, so the played span is read directly and cannot come out negative from swapped ends.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A trim reaching past the shot is refused with the overshoot as the violation amount rather than clamped to the shot end.
 * @evidence contracts/common.md#meaningful-documentation States the units, the range each field must satisfy, the containment rule and which producer refuses it.
 * @author Samchon
 */
export interface IAutoMovieTrim {
  /** Shot-local seconds where the trim begins; finite and at least `0`. */
  start: number;

  /** Finite positive length of the trimmed span, in seconds. */
  duration: number;
}
