import type { AutoMovieHumanDigit } from "../posture/AutoMovieHumanDigit";
import type { AutoMovieMotionHumanChannel } from "./AutoMovieMotionHumanChannel";

/**
 * A motion ownership claim for a whole body channel, one digit, or the supported trunk turn. Action composition uses this vocabulary for claims, yields and overlap checks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A motion ownership claim for a whole body channel, one digit, or the supported trunk turn. Action composition uses this vocabulary for claims, yields and overlap checks.
 * @evidence contracts/development/design.md#principled-representation A closed union of posture ownership units; channel and digit membership are type-checked, while composition checks overlapping claims.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Action plans and laws use claims and yields, while AutoMovieMotionHumanChannel and composed actions check ownership overlap with the same vocabulary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The union reuses channel and digit identifiers and adds only supported trunkTurn. Runtime composition owns conflict admission and the concrete bones belonging to each claim.
 */
export type AutoMovieMotionHumanChannelClaim =
  | AutoMovieMotionHumanChannel
  | AutoMovieHumanDigit
  | "trunkTurn";
