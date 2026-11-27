import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Present a hand to a partner and keep it there: the upper arm hangs, the
 * forearm comes forward level at the elbow's height and the hand is held out
 * palm down, fingers forward, for a ring to be slipped on or a hand to be
 * kissed, then it returns.
 */
export interface IAutoMovieMotionHumanPresentHand {
  /** The presented hand; the left when absent. */
  side?: AutoMovieHumanSide;

  /**
   * How long the hand stays presented, seconds; positive. Required: no natural
   * value is defined, so the author sets it (provisional: no timing study was
   * read).
   */
  hold: number;
}
