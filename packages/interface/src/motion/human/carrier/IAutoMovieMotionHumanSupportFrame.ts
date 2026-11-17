import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * The one reader of the frame a body's base rests on (#3491, P6): the
 * ground, a prop it sits or stands on (a saddle, a cart's bed, a deck), or a
 * performer's region it is borne on, with that frame's velocity and
 * acceleration at a second. Every consumer reads it here: a presented weapon
 * aimed in the support's frame, a launch inheriting the support's velocity,
 * the rider's inertial load (#3431), a borne person (#3437).
 *
 * The support is the bearing contact the action is entered on
 * (`IAutoMovieMotionHumanEntryState.supports`): the seat or the feet, not a gripping hand,
 * the first one on a prop or a person, the ground when every one is on the
 * ground. The velocity and the acceleration are the central differences of
 * the support's origin at the engine's plan-time step
 * (`integrateMotionTrajectory.STEP`, #3424). A performer's region is read
 * only at and before the second evaluated (#3437's contract), so its
 * differences are backward ones over the same step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation position: Its origin, world metres.
 * @evidence contracts/development/design.md#principled-representation position: Its origin, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: carrier/HumanSupportFrame.ts (HumanSupportFrame.at, return); carrier/HumanSupportCarry.ts (HumanSupportCarry.plan.frame).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanContactWindow.Support, IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSupportFrame {
  /**
   * The support's frame at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation position: Its origin, world metres.
   * @evidence contracts/development/design.md#principled-representation position: Its origin, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: carrier/HumanSupportFrame.ts (HumanSupportFrame.at, return); carrier/HumanSupportCarry.ts (HumanSupportCarry.plan.frame).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanContactWindow.Support, IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFrame {
    /** What the base rests on. */
    support: IAutoMovieMotionHumanContactWindow.Support;

    /** Its origin, world metres. */
    position: IAutoMovieVector3;

    /** Its rotation to the world. */
    rotation: IAutoMovieQuaternion;

    /** Its origin's velocity, m/s. */
    velocity: IAutoMovieVector3;

    /** Its origin's acceleration, m/s². */
    acceleration: IAutoMovieVector3;
  }
}
