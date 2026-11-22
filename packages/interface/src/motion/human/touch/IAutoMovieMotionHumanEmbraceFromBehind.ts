import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Embrace a partner from behind (#4012): standing behind them, the arms go
 * around their waist with the palms on their abdomen, the chest leans
 * against their upper back and the chin rests on one of their shoulders,
 * held for the authored span and released.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what touches what, for how long and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The partner, the shoulder the chin rests on and a span in seconds; every place follows from the two bodies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `embraceFromBehind` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A partner the chest cannot lean onto, or a shoulder the chin cannot reach, is refused at runtime with the gap or the miss.
 */
export interface IAutoMovieMotionHumanEmbraceFromBehind {
  /** The partner embraced, standing ahead of the performer and facing the same way. */
  partner: string;

  /** The partner's shoulder the chin rests on; the left when absent. */
  shoulder?: AutoMovieHumanSide;

  /** How long the embrace is held, seconds; positive. Required: no natural value is defined, so the author sets it (provisional: no timing study was read). */
  hold: number;

  /** How the embrace is taken and let go. */
  manner?: IAutoMovieMotionManner;
}
