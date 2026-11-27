import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * One strike and rebound with a held drumstick at a fixed, horizontal cymbal's
 * `edge`. The stick stays in the same hand. The chain can align `contact1` to a
 * cue.
 */
export interface IAutoMovieMotionHumanCymbalStrike {
  /** The drumstick's prop subject, declaring `grip` and `face`. */
  stick: string;

  /** The fixed cymbal's prop subject, declaring its upward-facing `edge`. */
  cymbal: string;

  /** The hand that already grips the stick. */
  hand: AutoMovieHumanSide;
}
