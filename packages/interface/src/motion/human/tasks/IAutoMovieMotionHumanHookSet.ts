import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Set the hook: the hand holding a fishing rod lifts its tip sharply by an
 * angle in a set time, turning the rod about the grip.
 */
export interface IAutoMovieMotionHumanHookSet {
  /** The held rod's scene subject. */
  rod: string;

  /** How far the tip rises, degrees. */
  angle: number;

  /**
   * How long the lift takes, seconds. Required: no natural value is defined, so
   * the author sets it (provisional: no timing study was read).
   */
  duration: number;

  /** The hand holding the rod; whichever hand holds it when absent. */
  hand?: AutoMovieHumanSide;
}
