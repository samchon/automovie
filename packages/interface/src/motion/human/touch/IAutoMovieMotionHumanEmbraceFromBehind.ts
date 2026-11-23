import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Embrace a partner from behind: standing behind them, the arms go around their
 * waist with the palms on their abdomen, the chest leans against their upper
 * back and the chin rests on one of their shoulders, held for the authored span
 * and released.
 */
export interface IAutoMovieMotionHumanEmbraceFromBehind {
  /**
   * The partner embraced, standing ahead of the performer and facing the same
   * way.
   */
  partner: string;

  /** The partner's shoulder the chin rests on; the left when absent. */
  shoulder?: AutoMovieHumanSide;

  /**
   * How long the embrace is held, seconds; positive. Required: no natural value
   * is defined, so the author sets it (provisional: no timing study was read).
   */
  hold: number;

  /** How the embrace is taken and let go. */
  manner?: IAutoMovieMotionManner;
}
