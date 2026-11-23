import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A single stroke of a held drumstick on the fixed head of a side drum. The
 * chain can align its `contact1` event to a film cue.
 */
export interface IAutoMovieMotionHumanSideDrumStrike {
  /** The stick's prop subject, declaring `grip` and `face` contacts. */
  stick: string;

  /** The fixed drum's prop subject, declaring its upward-facing `head` surface. */
  drum: string;

  /** The hand that already grips the stick. */
  hand: AutoMovieHumanSide;
}
