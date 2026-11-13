import type { samplePoseVelocity } from "@automovie/engine";
import type {
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { IHumanActionPlan } from "./IHumanActionPlan";
import type { IHumanContactWindow } from "./IHumanContactWindow";

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

  /**
   * The root's linear acceleration as displayed up to the entry, world metres
   * per second squared: a path that continues the root from the entry starts
   * with it, so the rates of the joints a planted foot is re-solved through
   * do not change slope at the cut.
   */
  acceleration: IAutoMovieVector3;

  /** The posture the previous action wrote at the entry, or the initial standing posture. */
  posture: IHumanPosture;

  /** Each foot's displayed state. */
  feet: Record<"left" | "right", IHumanEntryState.IFoot>;

  /**
   * What the body rests on at the entry: every support the action it leaves
   * declares open at that instant (a foot planted, the seat on a chair, the
   * body lying), and both feet on the ground before the first action. An
   * action that keeps the posture it is entered in keeps these supports, so
   * a drink taken seated declares the seat it sits on.
   */
  supports: IHumanEntryState.ISupport[];

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

    /** The ankle's acceleration as displayed up to the entry, world metres per second squared. */
    acceleration: IAutoMovieVector3;

    /** The foot's angular velocity as displayed up to the entry, world radians per second. */
    spin: IAutoMovieVector3;
  }

  /** One support the body rests on. */
  export interface ISupport {
    /** The body part that bears. */
    part: IHumanContactWindow["part"];

    /** How it bears. */
    kind: IHumanContactWindow["kind"];

    /** The frame it bears on. */
    support: IHumanContactWindow.Support;
  }

  /** The interrupted action. */
  export interface IFrom {
    /** Its name. */
    name: HumanActionKey;

    /** The action it is a row of; its own name when it is none. */
    family: HumanActionKey;

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
