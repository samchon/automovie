import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionMeeting } from "../compose/IAutoMovieMotionMeeting";

/**
 * Things two people do together or to each other in company, as rows of
 * shipped actions and as mutual records over them (`HumanChain.mutual`).
 * Register the rows a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation glasses: Each role's held glass, by its prop id; mimed with fists when absent. window: Film seconds the clink is held over. table: The table's point the hands meet over, world metres.
 * @evidence contracts/development/design.md#principled-representation glasses: Each role's held glass, by its prop id; mimed with fists when absent. window: Film seconds the clink is held over. table: The table's point the hands meet over, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSocial.ts (HumanSocial.toast, params); lexicon/HumanSocial.ts (HumanSocial.armWrestle, params); lexicon/HumanSocial.ts (HumanSocial.toastOfFour, params); lexicon/HumanSocial.ts (HumanSocial.toast); lexicon/HumanSocial.ts (HumanSocial.armWrestle); lexicon/HumanSocial.ts (HumanSocial.toastOfFour).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionMeeting.IWindow, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSocial {
  /**
   * The shared parameters of `toast`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it names and its default.
   * @evidence contracts/development/design.md#principled-representation The glasses by role and the clink's window.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two optional members, both read by the record's act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A glass is a prop id the performance already holds.
   */
  export interface IToast {
    /** Each role's held glass, by its prop id; mimed with fists when absent. */
    glasses?: Record<"host" | "guest", string>;

    /** Film seconds the clink is held over. */
    window?: IAutoMovieMotionMeeting.IWindow;
  }

  /**
   * The shared parameters of `armWrestle`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The table's point, the winner and the struggle's time and end.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by the record's act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The pin's angle is checked against the arms' range by the law, not here.
   */
  export interface IArmWrestle {
    /** The table's point the hands meet over, world metres. */
    table: IAutoMovieVector3;

    /** The role that pins the other. */
    winner: "one" | "other";

    /** Seconds of struggle; 3 when absent. */
    seconds?: number;

    /** The forearms' angle from upright at the pin, degrees; the law's own when absent. */
    pin?: number;
  }

  /**
   * The shared parameters of `toastOfFour`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it names and its default.
   * @evidence contracts/development/design.md#principled-representation The glasses by role and the one meeting point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two optional members, both read by the record's act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A glass is a prop id the performance already holds.
   */
  export interface IToastOfFour {
    /** Each role's held glass, by its prop id; mimed with fists when absent. */
    glasses?: Record<"host" | "guest" | "third" | "fourth", string>;

    /** The one world point all four glasses come to, metres. */
    at?: IAutoMovieVector3;
  }
}
