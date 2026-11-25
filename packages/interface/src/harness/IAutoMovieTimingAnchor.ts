/**
 * One authored moment on an actor's beat-local timeline.
 *
 * `blockBeat` requires finite times inside the beat in nondecreasing list
 * order; simultaneous anchors are allowed. `performShot` requires an action by
 * that actor to cover every anchor instant. The cue is explanatory prose: the
 * gate checks temporal coverage, without interpreting the described action.
 */
export interface IAutoMovieTimingAnchor {
  /** Finite seconds into the beat, within `[0, duration]`. */
  t: number;

  /**
   * What happens at this instant, in a few words ("twists back in the saddle",
   * "looses the arrow", "the fist connects", "weight lands on the front
   * foot").
   */
  cue: string;
}
