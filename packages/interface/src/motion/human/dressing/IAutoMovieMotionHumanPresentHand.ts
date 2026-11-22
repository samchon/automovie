import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Present a hand to a partner and keep it there (#4015): the upper arm hangs,
 * the forearm comes forward level at the elbow's height and the hand is held
 * out palm down, fingers forward, for a ring to be slipped on or a hand to be
 * kissed, then it returns.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the posture held, how long and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The hand and the hold in seconds; the place follows from the body's own measure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `presentHand` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A hold of no length is refused at runtime by the law.
 */
export interface IAutoMovieMotionHumanPresentHand {
  /** The presented hand; the left when absent. */
  side?: AutoMovieHumanSide;

  /** How long the hand stays presented, seconds; positive. Required: no natural value is defined, so the author sets it (provisional: no timing study was read). */
  seconds: number;
}
