import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Set the hook (#3998): the hand holding a fishing rod lifts its tip
 * sharply by an angle in a set time, turning the rod about the grip.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The held rod, the tip's lift in degrees and its time in seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rod, the lift, its time and the holding hand.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A rod not held, a lift outside its range or a time of no length is refused at runtime.
 */
export interface IAutoMovieMotionHumanHookSet {
  /** The held rod's scene subject. */
  rod: string;

  /** How far the tip rises, degrees. */
  angle: number;

  /** How long the lift takes, seconds. Required: no natural value is defined, so the author sets it (provisional: no timing study was read). */
  seconds: number;

  /** The hand holding the rod; whichever hand holds it when absent. */
  hand?: AutoMovieHumanSide;
}
