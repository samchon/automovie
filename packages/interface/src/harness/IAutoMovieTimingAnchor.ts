/**
 * One authored moment on an actor's beat-local timeline.
 *
 * `blockBeat` requires finite times inside the beat in nondecreasing list order; simultaneous anchors are allowed. `performShot` requires an action by that actor to cover every anchor instant. The cue is explanatory prose: the gate checks temporal coverage, without interpreting the described action.
 *
 * @evidence contracts/common.md#principled-implementation A timestamp and cue pin a moment without inventing intermediate motion; blocking validates the closed beat interval and causal list order, and the performance gate checks membership in an actor action's time interval.
 * @evidence contracts/common.md#clear-and-simple-design Two fields separate the machine-checked instant from its authored meaning; duration and actor identity belong to the enclosing blocking plan rather than being copied into every anchor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The cue does not trigger phrase-specific synthesis; a temporally uncovered anchor is refused instead of silently moved, and equal times follow the same nondecreasing-order rule.
 * @evidence contracts/common.md#meaningful-documentation States beat-local seconds, finite bounds, simultaneous-anchor semantics, action coverage and the limit that cue meaning is not checked against the action.
 *
 * @author Samchon
 */
export interface IAutoMovieTimingAnchor {
  /** Finite seconds into the beat, within `[0, duration]`. */
  t: number;

  /**
   * What happens at this instant, in a few words ("twists back in the saddle", "looses the arrow", "the fist connects", "weight lands on the front foot").
   */
  cue: string;
}
