import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A planned prop attachment to a humanoid bone beginning at a share of the action's duration. Performance placement applies the attachment after the action's wear event.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A planned prop attachment to a humanoid bone beginning at a share of the action's duration. Performance placement applies the attachment after the action's wear event.
 * @evidence contracts/development/design.md#principled-representation from: Share of this action from which the prop is worn. wearer: The performer whose bone it rides; the acting performer when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Wear-producing action plans publish bone attachments consumed by performance prop placement; the record owns the transition event rather than duplicating a prop's persistent worn configuration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The start is a normalized duration share. Performance placement resolves the prop and bone and captures its attachment transform; no film-second alias is substituted.
 */
export interface IAutoMovieMotionPropWear {
  /** The prop's subject. */
  prop: string;

  /** The bone it rides. */
  bone: AutoMovieHumanoidBone;

  /** Share of this action from which the prop is worn. */
  from: number;

  /** The performer whose bone it rides, so one person can dress another; the performer of the action when absent. */
  wearer?: string;

  /** A second part the worn prop binds the worn bone to, as handcuffs bind both wrists or a rope binds a wrist to a chair; a prop that binds nothing when absent. */
  link?: IAutoMovieMotionPropWear.ILink;
}

/**
 * Companion types of {@link IAutoMovieMotionPropWear}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a link binds and how far it lets the parts part.
 * @evidence contracts/development/design.md#principled-representation A link is a second end and a slack: the wearer's other bone, or a target in the scene, and the most the two ends may separate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two kinds of second end the arrest and captive scenes bind and one length.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Exactly one end kind is required, and a negative or non-finite slack is refused when the performance is built.
 */
export namespace IAutoMovieMotionPropWear {
  /**
   * The second end of a binding: while the prop is worn, the bound ends keep
   * the places they had when it was put on, never more than `slack` apart,
   * until a later grip takes the prop off and the parts are freed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents ILink: The second end of a binding: while the prop is worn, the bound ends keep the places they had when it was put on, never more than `slack` apart, until a later grip takes the prop off and the parts are freed.
   */
  export interface ILink {
    /** The wearer's other bound bone, such as the other wrist; absent when the prop binds to a target. */
    bone?: AutoMovieHumanoidBone;

    /** The scene point the worn bone is bound to, such as a chair's back; absent when the prop binds a second bone. */
    target?: IAutoMovieMotionTarget;

    /** The most the two ends may separate, metres: a chain's or a rope's free length. */
    slack: number;
  }
}
