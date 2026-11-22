import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanTiming } from "../compose/IAutoMovieMotionHumanTiming";
import type { IAutoMovieMotionHumanDressPartner } from "./IAutoMovieMotionHumanDressPartner";

/**
 * Bind another performer with a held restraint (#3974, #4002): handcuffs
 * closed on a wrist and linked to the other wrist, a rope tied round the
 * wrists or the ankles, a wrist tied to a chair's back. The binder carries
 * the restraint to the partner's region as a dressing does, the restraint
 * is worn there from the arrival, and from then the bound parts keep the
 * places they had, within the link's slack, until a later grip takes the
 * restraint off.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is carried where, what the link binds and when it frees.
 * @evidence contracts/development/design.md#principled-representation The dressing of a partner plus the link the wear carries, so custody and binding are one record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dressing's members, the visit's pause for its hold, and one link.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A link naming both or neither end, or a bad slack, is refused at runtime by the law.
 */
export interface IAutoMovieMotionHumanBindPartner extends Omit<
  IAutoMovieMotionHumanDressPartner,
  "hold"
> {
  /** How long the hand stays at the region before letting go: a pause of the arm phrase's visit; a beat when absent. */
  hold?: IAutoMovieMotionHumanTiming.Pause;

  /** What the restraint binds the region to. */
  link: IAutoMovieMotionHumanBindPartner.ILink;
}

/** Companion types of {@link IAutoMovieMotionHumanBindPartner}. */
export namespace IAutoMovieMotionHumanBindPartner {
  /**
   * The second end of the binding and its slack.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two alternative second ends, the slack's unit and what it bounds.
   * @evidence contracts/development/design.md#principled-representation The second end is a partner's region or a scene target; the slack is metres of free length between the two ends.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One second end and one length, read by the bind-partner law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The two ends are optional fields rather than a union, so naming both or neither end and a bad slack remain for the law's runtime refusal.
   */
  export interface ILink {
    /** The partner's other bound region, such as the other wrist; absent when the restraint binds to a target. */
    region?: AutoMovieHumanoidRegion;

    /** The scene point the region is bound to, such as a chair's back rail; absent when a second region is bound. */
    target?: IAutoMovieMotionTarget;

    /** The most the two ends may separate, metres: a chain's or a rope's free length. */
    slack: number;
  }
}
