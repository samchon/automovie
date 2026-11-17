import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMovieSamplePoseVelocity } from "../../IAutoMovieSamplePoseVelocity";
import type { AutoMovieMotionHumanActionKey } from "../AutoMovieMotionHumanActionKey";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanBase } from "./IAutoMovieMotionHumanBase";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";

/**
 * The displayed state an action is entered from: the pose and its velocity
 * at the entry second, the posture the previous action wrote there, the feet
 * on the floor, and the action it interrupts.
 *
 * A law plans from this state so its root, its planted feet and its effectors
 * continue where the previous action left them; only what the law cannot
 * plan from (the remaining joint offsets) is left to the transition's
 * inertialization. Every point is in world metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation acceleration: The root's linear acceleration as displayed up to the entry, world metres per second squared: a path that continues the root from the entry starts with it, so the rates of the joints a planted foot is re-solved through do not change slope at the cut.
 * @evidence contracts/development/design.md#principled-representation acceleration: The root's linear acceleration as displayed up to the entry, world metres per second squared: a path that continues the root from the entry starts with it, so the rates of the joints a planted foot is re-solved through do not change slope at the cut.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jumpTakeoff.ts (jumpTakeoff, entry); actions/stand.ts (stand.feet, entry); actions/standFeet.ts (standFeet.of, entry); actions/walkFacing.ts (walkFacing.share, entry); carrier/HumanSupportFrame.ts (HumanSupportFrame.floor, entry); everyday/seated.ts (seated.floor, entry).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMoviePose, IAutoMovieSamplePoseVelocity.IVelocity, IAutoMovieVector3, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanBase identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanEntryState {
  /** Film second of the entry. */
  seconds: number;

  /** The displayed pose at the entry. */
  pose: IAutoMoviePose;

  /** Its velocity. */
  velocity: IAutoMovieSamplePoseVelocity.IVelocity;

  /**
   * The root's linear acceleration as displayed up to the entry, world metres
   * per second squared: a path that continues the root from the entry starts
   * with it, so the rates of the joints a planted foot is re-solved through
   * do not change slope at the cut.
   */
  acceleration: IAutoMovieVector3;

  /** The posture the previous action wrote at the entry, or the initial standing posture. */
  posture: IAutoMovieMotionHumanPosture;

  /** Each foot's displayed state. */
  feet: Record<"left" | "right", IAutoMovieMotionHumanEntryState.IFoot>;

  /**
   * What the body rests on at the entry: every support the action it leaves
   * declares open at that instant (a foot planted, the seat on a chair, the
   * body lying), and both feet on the ground before the first action. An
   * action that keeps the posture it is entered in keeps these supports, so
   * a drink taken seated declares the seat it sits on.
   */
  supports: IAutoMovieMotionHumanEntryState.ISupport[];

  /**
   * What carries the body at the entry: standing before the first action,
   * then the base the last action that changed it declared, passed on
   * through every action that keeps it. A seated base carries the seat sat
   * on, so the action that leaves it knows its height, its heading and
   * whether it is sat astride without the composition restating it.
   */
  base: IAutoMovieMotionHumanBase;

  /**
   * The prop each hand holds at the entry, by its subject id: what an
   * earlier action left held and none has taken over or put down since. An
   * act performed with what the hand holds reads it here instead of judging
   * from how near the prop lies.
   */
  holds: Partial<Record<"left" | "right", string>>;

  /** The interrupted action, when the entry is a cut. */
  from?: IAutoMovieMotionHumanEntryState.IFrom;
}

/**
 * Contracts used by jumpTakeoff, stand.feet, standFeet.of, walkFacing.share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation ankle: The ankle joint, world metres. velocity: The ankle's velocity as displayed up to the entry, world metres per second. acceleration: The ankle's acceleration as displayed up to the entry, world metres per second squared.
 * @evidence contracts/development/design.md#principled-representation ankle: The ankle joint, world metres. velocity: The ankle's velocity as displayed up to the entry, world metres per second. acceleration: The ankle's acceleration as displayed up to the entry, world metres per second squared.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jumpTakeoff.ts (jumpTakeoff, entry); actions/stand.ts (stand.feet, entry); actions/standFeet.ts (standFeet.of, entry); actions/walkFacing.ts (walkFacing.share, entry); carrier/HumanSupportFrame.ts (HumanSupportFrame.floor, entry); everyday/seated.ts (seated.floor, entry).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanContactWindow.Support, AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanActionPlan identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanEntryState {
  /**
   * Whether an entry foot stands on the floor: planted, with its ankle within half a thigh's radius of its standing height. A foot planted on a rest, hanging or in flight does not. One foot's displayed state.
   *
   * @evidence contracts/development/common.md#meaningful-documentation ankle: The ankle joint, world metres. velocity: The ankle's velocity as displayed up to the entry, world metres per second. acceleration: The ankle's acceleration as displayed up to the entry, world metres per second squared.
   * @evidence contracts/development/design.md#principled-representation ankle: The ankle joint, world metres. velocity: The ankle's velocity as displayed up to the entry, world metres per second. acceleration: The ankle's acceleration as displayed up to the entry, world metres per second squared.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanMount.ts (HumanMount.grounded, foot); perform/HumanSegmentEntry.ts (HumanSegmentEntry.entry.foot, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
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

  /**
   * One support the body rests on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation part: The body part that bears. kind: How it bears. support: The frame it bears on.
   * @evidence contracts/development/design.md#principled-representation part: The body part that bears. kind: How it bears. support: The frame it bears on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: carrier/HumanSupportFrame.ts (HumanSupportFrame.of.bearing, s); carrier/HumanSupportFrame.ts (HumanSupportFrame.contact, support); handling/handOver.ts (handOver.plan.lean, s); handling/handshake.ts (handshake.plan.seated, s); handling/handshakeMeeting.ts (handshakeMeeting.read, s); handling/pickUp.ts (pickUp.plan.plan, s).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanContactWindow.Support identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISupport {
    /** The body part that bears. */
    part: IAutoMovieMotionHumanContactWindow["part"];

    /** How it bears. */
    kind: IAutoMovieMotionHumanContactWindow["kind"];

    /** The frame it bears on. */
    support: IAutoMovieMotionHumanContactWindow.Support;
  }

  /**
   * The interrupted action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation start: Film second of its time zero. share: The share of it at which it was cut.
   * @evidence contracts/development/design.md#principled-representation start: Film second of its time zero. share: The share of it at which it was cut.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in law/IAutoMovieMotionHumanEntryState.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanActionPlan identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
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
