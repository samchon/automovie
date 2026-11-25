import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A staged disarm: the defender takes a knife or a handgun from a resisting
 * partner, and the partner's hand gives it up.
 *
 * Fight directors stage both as controlled, rehearsed prop transfers (Society
 * of American Fight Directors, https://www.safd.org/). For a knife the
 * defender's hands close on the armed wrist and forearm and lever the armed
 * hand round until its grip opens; for a handgun the defender's hand first
 * pushes the barrel off the line, then grips it and turns it toward the
 * holder's thumb, the weak side of the grip, until the grip opens. The
 * defender's hand on the armed wrist then takes the weapon. The partner
 * performs `disarmed`, which reads the disarm by its anchor, so its armed hand
 * opens as the defender's hand takes the weapon.
 */
export namespace IAutoMovieMotionHumanDisarm {
  /** The weapon the technique is staged for. */
  export type Kind = "knife" | "handgun";

  /** The defender's parameters. */
  export interface IParams {
    /** The armed partner. */
    partner: string;

    /** The weapon's scene subject id, held by the partner. */
    prop: string;

    /** The technique's weapon kind. */
    kind: Kind;

    /**
     * The defender's hand that takes the weapon by its grip; the right when
     * absent.
     */
    hand?: AutoMovieHumanSide;

    /**
     * How long the lever turns the armed hand before its grip opens, seconds;
     * 0.5 s when absent (`disarm.LEVER`, authored, no study). The defender then
     * holds the weapon 0.4 s (`disarm.AFTER`). A longer lever fits a resisting
     * partner.
     */
    lever?: number;
  }

  /**
   * The armed partner's parameters: the hand that gives the weapon up follows
   * the defender's lever.
   */
  export interface IYield {
    /** The defender performing the disarm. */
    partner: string;

    /**
     * The anchor of the defender's disarm, whose `taken` instant the armed hand
     * opens at.
     */
    of: string;
  }
}
