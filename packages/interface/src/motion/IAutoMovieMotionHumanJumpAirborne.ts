/**
 * A jump's time in the air: the shape it holds between take-off and touchdown,
 * the knee hint its legs bend toward, and the turns it asks the performance's
 * flight pass for, with the hook that hands the rotation back
 * (`IAutoMovieMotionHumanActionPlan.airborne`).
 */
export namespace IAutoMovieMotionHumanJumpAirborne {
  /** A flight's requested turns. */
  export interface IRotation {
    /** Somersault turns, whole or half, at least 0; 0 when absent. */
    somersault?: number;

    /** Twist turns, signed; 0 when absent. */
    twist?: number;

    /** Which way the somersault turns; `forward` when absent. */
    way?: "forward" | "backward" | "left" | "right";
  }
}
