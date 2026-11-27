import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMoviePoseVelocity } from "./IAutoMoviePoseVelocity";
import type { AutoMovieMotionHumanActionKey } from "./AutoMovieMotionHumanActionKey";
import type { IAutoMovieMotionHumanGraspUse } from "./IAutoMovieMotionHumanGraspUse";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanBase } from "./IAutoMovieMotionHumanBase";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";

/**
 * The displayed state an action is entered from: the pose and its velocity at
 * the entry second, the posture the previous action wrote there, the feet on
 * the floor, and the action it interrupts.
 *
 * A law plans from this state so its root, its planted feet and its effectors
 * continue where the previous action left them; only what the law cannot plan
 * from (the remaining joint offsets) is left to the transition's
 * inertialization. Every point is in world metres.
 */
export interface IAutoMovieMotionHumanEntryState {
  /** Film second of the entry. */
  seconds: number;

  /** The displayed pose at the entry. */
  pose: IAutoMoviePose;

  /** Its velocity. */
  velocity: IAutoMoviePoseVelocity;

  /**
   * The root's linear acceleration as displayed up to the entry, world metres
   * per second squared: a path that continues the root from the entry starts
   * with it, so the rates of the joints a planted foot is re-solved through do
   * not change slope at the cut.
   */
  acceleration: IAutoMovieVector3;

  /**
   * The posture the previous action wrote at the entry, or the initial standing
   * posture.
   */
  posture: IAutoMovieMotionHumanPosture;

  /** Each foot's displayed state. */
  feet: Record<"left" | "right", IAutoMovieMotionHumanEntryState.IFoot>;

  /**
   * What the body rests on at the entry: every support the action it leaves
   * declares open at that instant (a foot planted, the seat on a chair, the
   * body lying), and both feet on the ground before the first action. An action
   * that keeps the posture it is entered in keeps these supports, so a drink
   * taken seated declares the seat it sits on.
   */
  supports: IAutoMovieMotionHumanEntryState.ISupport[];

  /**
   * What carries the body at the entry: standing before the first action, then
   * the base the last action that changed it declared, passed on through every
   * action that keeps it. A seated base carries the seat sat on, so the action
   * that leaves it knows its height, its heading and whether it is sat astride
   * without the composition restating it.
   */
  base: IAutoMovieMotionHumanBase;

  /**
   * The prop each hand holds at the entry, by its subject id: what an earlier
   * action left held and none has taken over or put down since. An act
   * performed with what the hand holds reads it here instead of judging from
   * how near the prop lies.
   */
  holds: Partial<Record<"left" | "right", string>>;

  /**
   * The use each held prop's grip was chosen for, by the holding hand
   * (`IAutoMovieMotionPropHold.use`); a hand whose grip was chosen for its
   * reach alone is absent. An act that uses the prop reads whether the grip
   * allows it here.
   */
  uses: Partial<Record<"left" | "right", IAutoMovieMotionHumanGraspUse.IUse>>;

  /** The interrupted action, when the entry is a cut. */
  from?: IAutoMovieMotionHumanEntryState.IFrom;
}

/** Contracts used by jumpTakeoff, stand.feet, standFeet, walkFacing.share. */
export namespace IAutoMovieMotionHumanEntryState {
  /**
   * Whether an entry foot stands on the floor: planted, with its ankle within
   * half a thigh's radius of its standing height. A foot planted on a rest,
   * hanging or in flight does not. One foot's displayed state.
   */
  export interface IFoot {
    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;

    /** Whether the foot is planted on the floor at the entry. */
    planted: boolean;

    /**
     * The ankle's velocity as displayed up to the entry, world metres per
     * second.
     */
    velocity: IAutoMovieVector3;

    /**
     * The ankle's acceleration as displayed up to the entry, world metres per
     * second squared.
     */
    acceleration: IAutoMovieVector3;

    /**
     * The foot's angular velocity as displayed up to the entry, world radians
     * per second.
     */
    spin: IAutoMovieVector3;
  }

  /**
   * One support the body rests on, retaining its anatomical region, foot
   * socket, fitted material and explicit weight share when the contact declares
   * them.
   */
  export interface ISupport extends Pick<
    IAutoMovieMotionHumanContactWindow,
    "region" | "socket" | "material" | "load"
  > {
    /** The body part that bears. */
    part: IAutoMovieMotionHumanContactWindow["part"];

    /** How it bears. */
    kind: IAutoMovieMotionHumanContactWindow["kind"];

    /** The frame it bears on. */
    support: IAutoMovieMotionHumanContactWindow.Support;
  }

  /** The interrupted action. */
  export interface IFrom {
    /** Its name. */
    name: AutoMovieMotionHumanActionKey;

    /** The action it is a row of; its own name when it is none. */
    family: AutoMovieMotionHumanActionKey;

    /** Its parameters. */
    params: object;

    /** Its plan. */
    plan: IAutoMovieMotionHumanActionPlan;

    /** Film second of its time zero. */
    start: number;

    /** The share of it at which it was cut. */
    share: number;
  }
}
