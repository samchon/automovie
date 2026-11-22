import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanSeated } from "../everyday/IAutoMovieMotionHumanSeated";

/**
 * Sit down onto a chair with two crutches, or rise from it (#3994), in the
 * order the clinical instructions give (Cornell Health, Using crutches;
 * HealthLinkBC, Using crutches): to sit, both crutches go into the hand on
 * the injured side, the other hand reaches back for the chair, and the body
 * lowers onto the seat with the injured leg kept off the floor; to rise,
 * the free hand pushes up from the chair while the injured side's hand
 * still holds both crutches, the body stands on the sound leg, and the free
 * hand then takes its crutch back. The crutches are held, never leaned on,
 * through the sit and the rise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both orders, their sources and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The two crutch props, the injured side, the seat and the direction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `HumanCrutchSit` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Crutches without a grip and a tip, a sit without a seat and a rise from standing are refused at runtime.
 */
export interface IAutoMovieMotionHumanCrutchSit {
  /** The crutch at the left side, a prop with a `grip` and a `tip`. */
  left: string;

  /** The crutch at the right side, a prop with a `grip` and a `tip`. */
  right: string;

  /** The injured leg, kept off the floor; the left when absent. */
  injured?: AutoMovieHumanSide;

  /** The chair sat on, its armrest on the sound side if it has one; required to sit, ignored when rising. */
  seat?: IAutoMovieMotionHumanSeated.ISeat;

  /** Rise from the chair instead of sitting down. */
  rise?: boolean;
}
