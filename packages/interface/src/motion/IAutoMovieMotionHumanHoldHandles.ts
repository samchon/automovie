/**
 * Walking behind an implement with both hands on its two handles: a ploughman
 * on a walking plough's grips, as an arms overlay over an authored walk.
 *
 * The walk underneath owns the steps and the root. The implement prop owns
 * where its handles are at every film second, so the scene stages the
 * implement's course and the walk together; the action refuses a sample whose
 * displayed hand cannot reach its handle.
 */
export interface IAutoMovieMotionHumanHoldHandles {
  /** The implement prop's subject id in the performance. */
  on: string;

  /**
   * The implement's affordance id the left hand grips; `leftHandle` when
   * absent.
   */
  left?: string;

  /**
   * The implement's affordance id the right hand grips; `rightHandle` when
   * absent.
   */
  right?: string;

  /**
   * Seconds the action lasts, acquiring and releasing included, more than twice
   * `transition`.
   */
  duration: number;

  /**
   * Seconds the hands take to reach the handles, and again to let them go,
   * positive.
   */
  transition: number;
}
