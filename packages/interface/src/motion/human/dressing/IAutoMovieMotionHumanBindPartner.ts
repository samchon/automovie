import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dressing's members and one link.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A link naming both or neither end, or a bad slack, is refused at runtime by the law.
 */
export interface IAutoMovieMotionHumanBindPartner extends IAutoMovieMotionHumanDressPartner {
  /** What the restraint binds the region to. */
  link: IAutoMovieMotionHumanBindPartner.ILink;
}

/**
 * Companion types of {@link IAutoMovieMotionHumanBindPartner}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the link's ends and length.
 * @evidence contracts/development/design.md#principled-representation The second end is a partner's region or a scene target, resolved to a bone or kept as the target.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One second end and one length.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Exactly one end is required.
 */
export namespace IAutoMovieMotionHumanBindPartner {
  /** The second end of the binding and its slack. */
  export interface ILink {
    /** The partner's other bound region, such as the other wrist; absent when the restraint binds to a target. */
    region?: AutoMovieHumanoidRegion;

    /** The scene point the region is bound to, such as a chair's back rail; absent when a second region is bound. */
    target?: IAutoMovieMotionTarget;

    /** The most the two ends may separate, metres: a chain's or a rope's free length. */
    slack: number;
  }
}
