import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Turn over while lying (#3987): between the back, either side and the
 * front about the body's long axis, on the floor or on a bed's surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the turn and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The lying position reached, the side a half turn passes and the support it lies on.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The position, the side, the support, the hold and the manner the bedroom and sleep scenes use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An entry not lying is refused at runtime.
 */
export interface IAutoMovieMotionHumanTurnOver {
  /** The lying position reached. */
  to: IAutoMovieMotionHumanTurnOver.Position;

  /** The side a turn between the back and the front passes over; the left when absent. */
  via?: AutoMovieHumanSide;

  /** The prop whose lying surface bears the body; the floor when absent. */
  on?: IAutoMovieMotionHumanTurnOver.IOn;

  /** How long the reached position is held, seconds; none when absent. */
  hold?: number;

  /** How the body turns. */
  manner?: IAutoMovieMotionManner;
}

/**
 * Companion types of {@link IAutoMovieMotionHumanTurnOver}.
 */
export namespace IAutoMovieMotionHumanTurnOver {
  /**
   * The lying positions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four lying positions about the body's long axis.
   * @evidence contracts/development/design.md#principled-representation A closed union of the back, either side and the front, the quarter turns about the long axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The action's `to` member reads it as the position reached.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal per position, with no optional fields to combine.
   */
  export type Position = "supine" | "lateralLeft" | "prone" | "lateralRight";

  /**
   * A lying surface on a prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the prop and its surface affordance, with the default.
   * @evidence contracts/development/design.md#principled-representation A prop by scene id and one of its `surface` affordances by id.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, the `on` of turnOver and lieTogether, read by turnOver and composeHumanSleep to place the lying body.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing prop or surface remains for runtime refusal.
   */
  export interface IOn {
    /** The bed or sofa prop. */
    prop: string;

    /** Its lying surface affordance; `surface` when absent. */
    surface?: string;
  }
}
