import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieAffordance } from "../../../model/IAutoMovieAffordance";
import type { IAutoMovieMotionHumanTouchEffector } from "./IAutoMovieMotionHumanTouchEffector";

/**
 * The prop a hand holds as an action enters, in that hand's own frame: the one
 * reading every action that works with a held thing starts from, whether it
 * brings a glass's lip to the mouth or a blade's point to a target.
 *
 * A held prop is rigid in the hand from the instant its grip closed, so the
 * prop's frame, and with it every point and direction the prop declares, is a
 * constant of the hand's grip frame for as long as it is held. The grip frame
 * is the performance's own: the grip socket's point with the hand bone's
 * rotation, the frame a held prop is carried in. It is read once, at the
 * action's entry, from the displayed prop and the displayed hand, so an action
 * aims what the film shows whichever way the hand took the prop.
 *
 * Whether the hand holds the prop is the entry state's fact
 * (`IAutoMovieMotionHumanEntryState.holds`), never a judgment from how near it
 * lies.
 */
export namespace IAutoMovieMotionHumanHeld {
  /** A prop in the hand that holds it. */
  export interface IHeld {
    /** The prop's subject id. */
    prop: string;

    /** The holding hand. */
    side: "left" | "right";

    /**
     * The prop's frame in the hand's grip frame: its origin from the grip
     * socket in the hand bone's axes, metres, and its rotation from the hand
     * bone's.
     */
    frame: IAutoMovieRigidTransform;

    /** The prop's contacts, in its own frame. */
    affordances: readonly IAutoMovieAffordance[];
  }

  /** What an act states of how it uses a held prop. */
  export interface IUse {
    /**
     * The hand's attitude without a prop: its surface and shape are kept, and
     * its facing and along directions say which side of the prop meets the
     * region.
     */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

    /**
     * `true` when the prop stands on the world's up at the region, as a vessel
     * does.
     */
    upright?: boolean;

    /** The prop's point that meets the region; the caller names it when absent. */
    point?: string;
  }

  /**
   * A prop in the grip frame of a hand that has not taken it yet: a grasp's
   * candidate wrist, the prop where it lies, the offset the grip would keep
   * once it closed there. Input wrist of AutoMovieMotionHumanHeld.grasped. The
   * candidate hand's wrist, world.
   */
  export type IGraspedWrist = {
    /** Grasped wrist position in world metres. */
    point: IAutoMovieVector3;
    /** Grasped hand orientation as a world unit quaternion. */
    rotation: IAutoMovieQuaternion;
  };

  /**
   * One of the prop's contacts in the hand's grip frame. Result returned by
   * AutoMovieMotionHumanHeld.point. Its point from the grip socket, metres, and
   * the unit direction its `+Y` runs, both in the hand bone's axes.
   */
  export type IPointResult = {
    /** Held affordance point expressed in the hand frame, metres. */
    point: IAutoMovieVector3;
    /** Held affordance direction expressed in the hand frame. */
    direction: IAutoMovieVector3;
  };
}
