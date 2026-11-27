import type { AutoMovieHumanDigit } from "./AutoMovieHumanDigit";
import type { AutoMovieMotionHumanChannel } from "./AutoMovieMotionHumanChannel";

/**
 * A motion ownership claim for a whole body channel, one digit, or the
 * supported trunk turn. Action composition uses this vocabulary for claims,
 * yields and overlap checks.
 */
export type AutoMovieMotionHumanChannelClaim =
  | AutoMovieMotionHumanChannel
  | AutoMovieHumanDigit
  | "trunkTurn";
