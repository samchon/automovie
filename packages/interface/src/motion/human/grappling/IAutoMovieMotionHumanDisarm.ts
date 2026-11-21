import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A staged disarm: the defender takes a knife or a handgun from a resisting
 * partner, and the partner's hand gives it up.
 *
 * Fight directors stage both as controlled, rehearsed prop transfers
 * (Society of American Fight Directors, https://www.safd.org/). For a knife
 * the defender's hands close on the armed wrist and forearm and lever the
 * armed hand round until its grip opens; for a handgun the defender's hand
 * first pushes the barrel off the line, then grips it and turns it toward
 * the holder's thumb, the weak side of the grip, until the grip opens. The
 * defender then holds the weapon by its grip, or lets it fall. The partner
 * performs `disarmed` on the same clock, its armed arm following the lever.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two techniques, the two roles, the outcome and the source.
 * @evidence contracts/development/design.md#principled-representation A closed weapon kind and outcome, the partner and the weapon by subject id, and one hand.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the `disarm` and `disarmed` laws read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The weapon's custody passes by grips the performance already resolves; no second owner is invented.
 */
export namespace IAutoMovieMotionHumanDisarm {
  /** The weapon the technique is staged for. */
  export type Kind = "knife" | "handgun";

  /** What the defender does with the weapon once the grip opens. */
  export type Outcome = "take" | "drop";

  /**
   * The defender's parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation Subject ids, a closed kind and outcome, a side and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `disarm.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law refuses a partner who does not hold the weapon and a lever out of reach.
   */
  export interface IParams {
    /** The armed partner. */
    partner: string;

    /** The weapon's scene subject id, held by the partner. */
    prop: string;

    /** The technique's weapon kind. */
    kind: Kind;

    /** The defender's hand that takes the weapon by its grip; the right when absent. */
    hand?: AutoMovieHumanSide;

    /** Whether the defender keeps the weapon or lets it fall; `take` when absent. */
    outcome?: Outcome;

    /** The disarm's length, seconds; 1.6 when absent. */
    seconds?: number;
  }

  /**
   * The armed partner's parameters: the hand that gives the weapon up
   * follows the defender's lever.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The defender by subject id.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `disarmed.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law reads the defender's own disarm instead of restating its timing.
   */
  export interface IYield {
    /** The defender performing the disarm. */
    partner: string;
  }
}
