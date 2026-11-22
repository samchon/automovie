import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Rest the head on a partner (#4012): the temple or the cheek laid on the
 * partner's shoulder or chest, seated side by side or standing, held for
 * the authored span and lifted again.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what touches what, for how long and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation Two named body regions, the resting one's own and the partner's, and a span in seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The partner, both regions, the hold and the manner the affection scenes use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A region the lean and the neck cannot bring the head to is refused at runtime with the miss.
 */
export interface IAutoMovieMotionHumanHeadRest {
  /** The partner rested on. */
  partner: string;

  /** The partner's region the head rests on, such as `shoulderLeft` or `chestRight`. */
  region: AutoMovieHumanoidRegion;

  /** The resting head's own region laid on it; the temple on the side the partner's region lies when absent. */
  own?: AutoMovieHumanoidRegion;

  /** How long the head rests, seconds. Required: no natural value is defined, so the author sets it (provisional: no timing study was read). */
  seconds: number;

  /** How the head goes down and comes up. */
  manner?: IAutoMovieMotionManner;
}
