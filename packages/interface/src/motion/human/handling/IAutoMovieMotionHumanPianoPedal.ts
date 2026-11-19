/**
 * The independent right-foot damper pedal performance of a seated pianist.
 * The pianoPedal law admits the fixed articulated piano, the seated
 * supports, the timed strokes and the foot's reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the player, target and runtime admission owner.
 * @evidence contracts/development/design.md#principled-representation Uses ordered press intervals on one clock, independent of the fingers' note times.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries the target prop, authored press intervals and action duration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads pedal geometry and travel from the staged model at planning.
 */
export interface IAutoMovieMotionHumanPianoPedal {
  /** Subject id of the fixed piano exposing the damperPedal plate and damperPedalHinge. */
  prop: string;

  /** Nonempty, ordered strokes with disjoint press windows. */
  presses: readonly IAutoMovieMotionHumanPianoPedal.IPress[];

  /** Action duration in seconds, greater than the last stroke's to time. */
  duration: number;
}

/**
 * The intervals of the pianoPedal action.
 */
export namespace IAutoMovieMotionHumanPianoPedal {
  /**
   * Each boundary is in seconds since action start, ordered as
   * 0 < from < at <= release < to < duration. The foot travels to the damper
   * before the first stroke and returns to its entry plant after the last.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the clock origin, boundary order and recovery.
   * @evidence contracts/development/design.md#principled-representation Four phase boundaries allow an independently authored dwell.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The interval carries only its times.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law derives intermediate travel from the model and the timed boundaries.
   */
  export interface IPress {
    /** The forefoot starts depressing the pedal from its rest height. */
    from: number;

    /** The pedal reaches its full depression. */
    at: number;

    /** The pedal starts to rise. */
    release: number;

    /** The pedal returns to its rest height beneath the forefoot. */
    to: number;
  }
}
