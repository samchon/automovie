import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A planned prop attachment to a humanoid bone beginning at a share of the
 * action's duration. Performance placement applies the attachment after the
 * action's wear event.
 */
export interface IAutoMovieMotionPropWear {
  /** The prop's subject. */
  prop: string;

  /** The bone it rides. */
  bone: AutoMovieHumanoidBone;

  /** Share of this action from which the prop is worn. */
  from: number;

  /**
   * The performer whose bone it rides, so one person can dress another; the
   * performer of the action when absent.
   */
  wearer?: string;

  /**
   * A second part the worn prop binds the worn bone to, as handcuffs bind both
   * wrists or a rope binds a wrist to a chair; a prop that binds nothing when
   * absent.
   */
  link?: IAutoMovieMotionPropWear.ILink;
}

/** Companion types of {@link IAutoMovieMotionPropWear}. */
export namespace IAutoMovieMotionPropWear {
  /**
   * The second end of a binding: while the prop is worn, the bound ends keep
   * the places they had when it was put on, never more than `slack` apart,
   * until a later grip takes the prop off and the parts are freed.
   */
  export interface ILink {
    /**
     * The wearer's other bound bone, such as the other wrist; absent when the
     * prop binds to a target.
     */
    bone?: AutoMovieHumanoidBone;

    /**
     * The scene point the worn bone is bound to, such as a chair's back; absent
     * when the prop binds a second bone.
     */
    target?: IAutoMovieMotionTarget;

    /**
     * The most the two ends may separate, metres: a chain's or a rope's free
     * length.
     */
    slack: number;
  }
}
