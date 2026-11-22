/**
 * Walking behind an implement with both hands on its two handles: a
 * ploughman on a walking plough's grips, as an arms overlay over an
 * authored walk.
 *
 * The walk underneath owns the steps and the root. The implement prop owns
 * where its handles are at every film second, so the scene stages the
 * implement's course and the walk together; the action refuses a sample
 * whose displayed hand cannot reach its handle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the support, the two handle contacts, the film-second duration and the acquire and release intervals.
 * @evidence contracts/development/design.md#principled-representation Two named contacts on one prop for both arms over a finite interval; positive timing that leaves a hold between acquiring and releasing is checked when the action is planned, and reach at each sample.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The walk owns travel and feet and the prop owns the handles' world frames; this record names only what the arms do.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No handle position or implement course is supplied here; the handles are read from the prop.
 */
export interface IAutoMovieMotionHumanHoldHandles {
  /** The implement prop's subject id in the performance. */
  on: string;

  /** The implement's affordance id the left hand grips; `leftHandle` when absent. */
  left?: string;

  /** The implement's affordance id the right hand grips; `rightHandle` when absent. */
  right?: string;

  /** Seconds the action lasts, acquiring and releasing included, more than twice `transition`. */
  seconds: number;

  /** Seconds the hands take to reach the handles, and again to let them go, positive. */
  transition: number;
}
