/**
 * The independent right-foot damper pedal performance of a seated pianist. The
 * pianoPedal law admits the fixed articulated piano, the seated supports, the
 * timed strokes and the foot's reach.
 */
export interface IAutoMovieMotionHumanPianoPedal {
  /**
   * Subject id of the fixed piano exposing the damperPedal plate and
   * damperPedalHinge.
   */
  prop: string;

  /** Nonempty, ordered strokes with disjoint press windows. */
  presses: readonly IAutoMovieMotionHumanPianoPedal.IPress[];

  /**
   * Action duration in seconds, greater than the last stroke's to time.
   * Required: the score sets it, so no natural value is defined.
   */
  duration: number;
}

/** The intervals of the pianoPedal action. */
export namespace IAutoMovieMotionHumanPianoPedal {
  /**
   * Each boundary is in seconds since action start, ordered as 0 < from < at <=
   * release < to < duration. The foot travels to the damper before the first
   * stroke and returns to its entry plant after the last.
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
