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
 * defender's hand on the armed wrist then takes the weapon. The partner
 * performs `disarmed`, which reads the disarm by its anchor, so its armed
 * hand opens as the defender's hand takes the weapon.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two techniques, the two roles, the custody change and the source.
 * @evidence contracts/development/design.md#principled-representation A closed weapon kind, the partner and the weapon by subject id, and one hand.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the `disarm` and `disarmed` laws read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The weapon's custody passes by grips the performance already resolves; no second owner is invented.
 */
export namespace IAutoMovieMotionHumanDisarm {
  /** The weapon the technique is staged for. */
  export type Kind = "knife" | "handgun";

  /**
   * The defender's parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation Subject ids, a closed kind, a side and seconds.
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

    /** How long the lever turns the armed hand before its grip opens, seconds; 0.5 s when absent (`disarm.LEVER`, authored, no study). The defender then holds the weapon 0.4 s (`disarm.AFTER`). A longer lever fits a resisting partner. */
    lever?: number;
  }

  /**
   * The armed partner's parameters: the hand that gives the weapon up
   * follows the defender's lever.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The defender by subject id and its disarm by anchor.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `disarmed.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law reads the defender's own disarm instead of restating its timing.
   */
  export interface IYield {
    /** The defender performing the disarm. */
    partner: string;

    /** The anchor of the defender's disarm, whose `taken` instant the armed hand opens at. */
    of: string;
  }
}
