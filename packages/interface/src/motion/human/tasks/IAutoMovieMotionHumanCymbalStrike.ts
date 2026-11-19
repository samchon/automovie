import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * One strike and rebound with a held drumstick at a fixed, horizontal
 * cymbal's `edge`. The stick stays in the same hand. The chain can align
 * `contact1` to a cue.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the strike site, grip outcome and timing seam.
 * @evidence contracts/development/design.md#principled-representation Identifies two staged prop subjects and the hand already holding the stick.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Holds only the inputs the opt-in strike law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No world position, stroke offset or clock data is duplicated.
 */
export interface IAutoMovieMotionHumanCymbalStrike {
  /** The drumstick's prop subject, declaring `grip` and `face`. */
  stick: string;

  /** The fixed cymbal's prop subject, declaring its upward-facing `edge`. */
  cymbal: string;

  /** The hand that already grips the stick. */
  hand: AutoMovieHumanSide;
}
