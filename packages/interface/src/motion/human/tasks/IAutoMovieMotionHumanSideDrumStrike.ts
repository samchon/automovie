import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A single stroke of a held drumstick on the fixed head of a side drum.
 * The chain can align its `contact1` event to a film cue.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the held implement, working site and timing seam.
 * @evidence contracts/development/design.md#principled-representation Two scene subjects and the hand already holding the implement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the inputs the opt-in stroke law needs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No world targets, offsets or duplicated clock data.
 */
export interface IAutoMovieMotionHumanSideDrumStrike {
  /** The stick's prop subject, declaring `grip` and `face` contacts. */
  stick: string;

  /** The fixed drum's prop subject, declaring its upward-facing `head` surface. */
  drum: string;

  /** The hand that already grips the stick. */
  hand: AutoMovieHumanSide;
}
