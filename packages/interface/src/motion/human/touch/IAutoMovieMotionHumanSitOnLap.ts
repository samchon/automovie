import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Sit on a seated partner's lap (#4012): a child or an adult stands before
 * the partner's knees, facing away, and sits down onto the partner's
 * thighs, which bear the sitter's seat while the partner's own seat still
 * bears on the chair. Getting off is the ordinary rise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what bears on what and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The partner and the time seated; the lap follows from the seated partner's thighs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `sitOnLap` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A partner who is not seated is refused at runtime; the sit's own refusals stand.
 */
export interface IAutoMovieMotionHumanSitOnLap {
  /** The seated partner whose lap is sat on. */
  partner: string;

  /** Seconds to stay seated on the lap after settling; the sit's own when absent. */
  hold?: number;

  /** How the sitter sits down. */
  manner?: IAutoMovieMotionManner;
}
