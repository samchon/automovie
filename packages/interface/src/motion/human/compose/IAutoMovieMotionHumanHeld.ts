import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieAffordance } from "../../../model/IAutoMovieAffordance";
import type { IAutoMovieMotionHumanProp } from "../perform/IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionHumanTouchEffector } from "./IAutoMovieMotionHumanTouchEffector";

/**
 * The prop a hand holds as an action enters, in that hand's own frame: the
 * one reading every action that works with a held thing starts from, whether
 * it brings a glass's lip to the mouth or a blade's point to a target.
 *
 * A held prop is rigid in the hand from the instant its grip closed, so the
 * prop's frame, and with it every point and direction the prop declares, is
 * a constant of the hand's grip frame for as long as it is held. The grip
 * frame is the performance's own: the grip socket's point with the hand
 * bone's rotation, the frame a held prop is carried in. It is read once, at
 * the action's entry, from the displayed prop and the displayed hand, so an
 * action aims what the film shows whichever way the hand took the prop.
 *
 * Whether the hand holds the prop is the entry state's fact
 * (`IAutoMovieMotionHumanEntryState.holds`), never a judgment from how near it lies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation frame: The prop's frame in the hand's grip frame: its origin from the grip socket in the hand bone's axes, metres, and its rotation from the hand bone's. point: The prop's point that meets the region; the caller names it when absent.
 * @evidence contracts/development/design.md#principled-representation frame: The prop's frame in the hand's grip frame: its origin from the grip socket in the hand bone's axes, metres, and its rotation from the hand bone's. point: The prop's point that meets the region; the caller names it when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.of, return); compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.grasped, return); compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.point, held); compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.grip, held); compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.hold, held); striking/StrikingHeld.ts (StrikingHeld.read, held).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanProp.IFrame, IAutoMovieAffordance, IAutoMovieMotionHumanTouchEffector.IEffector, IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanHeld {
  /**
   * A prop in the hand that holds it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, the frame of `frame` and that `affordances` are in the prop's own frame.
   * @evidence contracts/development/design.md#principled-representation The prop's subject id, the holding side, the prop's rigid offset in the hand's grip frame (metres and a rotation) and its declared contacts, the facts every held-thing action starts from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read through `of` and the point and direction readers by the handling and striking laws, the workout load and the pole vault; the affordances are the interface package's own type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop kind is named; the side is the closed `"left" | "right"` union and `frame` reuses `IAutoMovieMotionHumanProp.IFrame`.
   */
  export interface IHeld {
    /** The prop's subject id. */
    prop: string;

    /** The holding hand. */
    side: "left" | "right";

    /** The prop's frame in the hand's grip frame: its origin from the grip socket in the hand bone's axes, metres, and its rotation from the hand bone's. */
    frame: IAutoMovieMotionHumanProp.IFrame;

    /** The prop's contacts, in its own frame. */
    affordances: readonly IAutoMovieAffordance[];
  }

  /**
   * What an act states of how it uses a held prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and the meaning of its absence.
   * @evidence contracts/development/design.md#principled-representation The hand's attitude as an effector, whether the prop stands upright, and the prop's point by its id.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by `effector`; a hand-to-face row satisfies it as it is.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The point is the prop's own id, never coordinates.
   */
  export interface IUse {
    /** The hand's attitude without a prop: its surface and shape are kept, and its facing and along directions say which side of the prop meets the region. */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

    /** `true` when the prop stands on the world's up at the region, as a vessel does. */
    upright?: boolean;

    /** The prop's point that meets the region; the caller names it when absent. */
    point?: string;
  }

  /**
   * A prop in the grip frame of a hand that has not taken it yet: a grasp's candidate wrist, the prop where it lies, the offset the grip would keep once it closed there. Input wrist of AutoMovieMotionHumanHeld.grasped. The candidate hand's wrist, world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Grasped wrist position in world metres. rotation: Grasped hand orientation as a world unit quaternion.
   * @evidence contracts/development/design.md#principled-representation point: Grasped wrist position in world metres. rotation: Grasped hand orientation as a world unit quaternion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.grasped, wrist).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IGraspedWrist = {
    /** Grasped wrist position in world metres. */
    point: IAutoMovieVector3;
    /** Grasped hand orientation as a world unit quaternion. */
    rotation: IAutoMovieQuaternion;
  };

  /**
   * One of the prop's contacts in the hand's grip frame. Result returned by AutoMovieMotionHumanHeld.point. Its point from the grip socket, metres, and the unit direction its `+Y` runs, both in the hand bone's axes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Held affordance point expressed in the hand frame, metres. direction: Held affordance direction expressed in the hand frame.
   * @evidence contracts/development/design.md#principled-representation point: Held affordance point expressed in the hand frame, metres. direction: Held affordance direction expressed in the hand frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.point, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IPointResult = {
    /** Held affordance point expressed in the hand frame, metres. */
    point: IAutoMovieVector3;
    /** Held affordance direction expressed in the hand frame. */
    direction: IAutoMovieVector3;
  };
}
