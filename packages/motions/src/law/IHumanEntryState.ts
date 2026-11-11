import type { samplePoseVelocity } from "@automovie/engine";
import type {
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { IHumanActionPlan } from "./IHumanActionPlan";

/**
 * The displayed state an action is entered from: the pose and its velocity
 * at the entry second, the posture the previous action wrote there, the feet
 * on the floor, and the action it interrupts.
 *
 * A law plans from this state so its root, its planted feet and its effectors
 * continue where the previous action left them; only what the law cannot
 * plan from (the remaining joint offsets) is left to the transition's
 * inertialization. Every point is in world metres.
 */
export interface IHumanEntryState {
  /** Film second of the entry. */
  seconds: number;

  /** The displayed pose at the entry. */
  pose: IAutoMoviePose;

  /** Its velocity. */
  velocity: samplePoseVelocity.IVelocity;

  /** The posture the previous action wrote at the entry, or the initial standing posture. */
  posture: IHumanPosture;

  /** Each foot's displayed state. */
  feet: Record<"left" | "right", IHumanEntryState.IFoot>;

  /** The interrupted action, when the entry is a cut. */
  from?: IHumanEntryState.IFrom;
}
/**
 * Companion types of {@link IHumanEntryState}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame and unit.
 * @evidence contracts/development/design.md#principled-representation World-frame foot states and the interrupted action's own plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What laws read to continue a motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the plan and posture types.
 */
export namespace IHumanEntryState {
  /** One foot's displayed state. */
  export interface IFoot {
    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;

    /** Whether the foot is planted on the floor at the entry. */
    planted: boolean;

    /** The ankle's velocity as displayed up to the entry, world metres per second. */
    velocity: IAutoMovieVector3;

    /** The foot's angular velocity as displayed up to the entry, world radians per second. */
    spin: IAutoMovieVector3;
  }

  /** The interrupted action. */
  export interface IFrom {
    /** Its name. */
    name: HumanActionName;

    /** Its parameters. */
    params: object;

    /** Its plan. */
    plan: IHumanActionPlan;

    /** Film second of its time zero. */
    start: number;

    /** The share of it at which it was cut. */
    share: number;
  }
}
