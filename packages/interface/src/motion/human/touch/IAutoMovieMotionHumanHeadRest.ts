import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Rest the head on a partner: the temple or the cheek laid on the partner's
 * shoulder or chest, seated side by side or standing, held for the authored
 * span and lifted again.
 */
export interface IAutoMovieMotionHumanHeadRest {
  /** The partner rested on. */
  partner: string;

  /**
   * The partner's region the head rests on, such as `shoulderLeft` or
   * `chestRight`.
   */
  region: AutoMovieHumanoidRegion;

  /**
   * The resting head's own region laid on it; the temple on the side the
   * partner's region lies when absent.
   */
  own?: AutoMovieHumanoidRegion;

  /**
   * How long the head rests, seconds. Required: no natural value is defined, so
   * the author sets it (provisional: no timing study was read).
   */
  hold: number;

  /** How the head goes down and comes up. */
  manner?: IAutoMovieMotionManner;
}
