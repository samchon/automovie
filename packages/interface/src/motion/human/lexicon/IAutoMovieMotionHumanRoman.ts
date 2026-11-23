/**
 * Roman riding: standing with one foot on each of two horses that move together
 * side by side, the left foot on the left horse's seat and the right on the
 * right one's.
 */
export interface IAutoMovieMotionHumanRoman {
  /** The left horse's subject id. */
  left: string;

  /** The right horse's subject id. */
  right: string;

  /** The seat contact each foot stands on. */
  frame: string;

  /**
   * How long the stand is held once reached, seconds; positive, and the action
   * lasts `step` more. The two seats must stay between a hip width and the two
   * legs' span apart for the whole hold (a leg abducted 30 degrees), or the
   * stand is refused.
   */
  hold: number;

  /** Seconds it takes to come up from the entry; 0.6 when absent. */
  step?: number;
}
