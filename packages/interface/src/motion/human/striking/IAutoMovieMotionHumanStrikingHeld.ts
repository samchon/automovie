import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanHeld } from "../compose/IAutoMovieMotionHumanHeld";
import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A thing held in the hand as the effector of an action: a blade whose point
 * and edge are aimed, a firearm whose muzzle is aimed.
 *
 * A held prop is rigid in the hand from the instant the grip closed, so its
 * working point (a sword's point, a muzzle), its axis (the way the blade or
 * the barrel runs) and its edge (the way a blade cuts, a barrel's top) are
 * constants of the hand's frame for as long as it is held. This reads them
 * once at the action's entry, from where the prop is displayed and where the
 * hand is displayed, so the law aims the same thing the performance shows
 * whichever way the hand took the prop. With no prop named the hand itself
 * is the effector: the grip's centre, its line the hand's own from the wrist
 * to the knuckles, its edge the little finger's side, as a knife-hand cuts.
 *
 * The frame is the performance's own grip frame: the grip socket's point with
 * the hand bone's rotation. A goal built here puts the working point, not the
 * wrist, on its place: the goal's contact is the working point, so where the
 * wrist cannot turn the hand as asked the point stays and the turn gives way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: The affordance the working line runs from toward `tip`; absent, the point's declared direction supplies the line. Surface normals keep their contact meaning. edge: The affordance whose `+Y` is the edge's direction; absent, any direction square to the axis. prop: The prop's subject id; absent when the bare hand is the effector.
 * @evidence contracts/development/design.md#principled-representation from: The affordance the working line runs from toward `tip`; absent, the point's declared direction supplies the line. Surface normals keep their contact meaning. edge: The affordance whose `+Y` is the edge's direction; absent, any direction square to the axis. prop: The prop's subject id; absent when the bare hand is the effector.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: affordance/operateInsert.ts (operateInsert.tool, return); affordance/operateInsert.ts (operateInsert.target, tool); handling/HumanGraspDemand.ts (HumanGraspDemand.grip, return); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.held, return); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.setup, read); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.present.s, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Side, IAutoMovieVector3, IAutoMovieMotionHumanHeld.IHeld, IAutoMovieMotionHumanActionPlan.ITool, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanStrikingHeld {
  /**
   * The affordance ids read of a prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: The affordance the working line runs from toward `tip`; absent, the point's declared direction supplies the line. Surface normals keep their contact meaning. edge: The affordance whose `+Y` is the edge's direction; absent, any direction square to the axis.
   * @evidence contracts/development/design.md#principled-representation from: The affordance the working line runs from toward `tip`; absent, the point's declared direction supplies the line. Surface normals keep their contact meaning. edge: The affordance whose `+Y` is the edge's direction; absent, any direction square to the axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanGraspDemand.ts (HumanGraspDemand.grip, points); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.held, return); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.held, points); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.setup, read); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.present.s, points); striking/StrikingHeld.ts (StrikingHeld.of, points).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanGraspDemand.grip.
   */
  export interface IPoints {
    /** The working point's affordance, whose `+Y` runs out of the tool. */
    tip: string;

    /** The affordance the working line runs from toward `tip`; absent, the point's declared direction supplies the line. Surface normals keep their contact meaning. */
    from?: string;

    /** The affordance whose `+Y` is the edge's direction; absent, any direction square to the axis. */
    edge?: string;
  }

  /**
   * A held thing in the hand's grip frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation prop: The prop's subject id; absent when the bare hand is the effector. tip: The working point from the grip socket, in the hand bone's frame, metres. length: The working length behind the point along the axis, metres: the distance from an explicit `from`, otherwise the grip's projection behind the tip; 0 for the bare hand.
   * @evidence contracts/development/design.md#principled-representation prop: The prop's subject id; absent when the bare hand is the effector. tip: The working point from the grip socket, in the hand bone's frame, metres. length: The working length behind the point along the axis, metres: the distance from an explicit `from`, otherwise the grip's projection behind the tip; 0 for the bare hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: affordance/operateInsert.ts (operateInsert.tool, return); affordance/operateInsert.ts (operateInsert.target, tool); handling/HumanGraspDemand.ts (HumanGraspDemand.grip, return); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.held, return); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.setup, read); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.present.s, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Side, IAutoMovieVector3, IAutoMovieMotionHumanHeld.IHeld, IAutoMovieMotionHumanActionPlan.ITool identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ITool {
    /** The prop's subject id; absent when the bare hand is the effector. */
    prop?: string;

    /** The holding hand. */
    side: IAutoMovieMotionHumanHand.Side;

    /** The working point from the grip socket, in the hand bone's frame, metres. */
    tip: IAutoMovieVector3;

    /** The unit direction the tool runs toward its working point, hand frame. */
    axis: IAutoMovieVector3;

    /** The unit direction the tool cuts or sights along, square to the axis, hand frame. */
    edge: IAutoMovieVector3;

    /** Whether the tool has no edge of its own: a prop that declares no edge affordance (a bat, a club), whose `edge` is then only a direction square to the axis, so its roll about its own line is free to the arm. False for the bare hand, whose edge is the little finger's side. */
    rolls: boolean;

    /** The working length behind the point along the axis, metres: the distance from an explicit `from`, otherwise the grip's projection behind the tip; 0 for the bare hand. */
    length: number;

    /**
     * The run of the tool's edge along its axis, metres behind the working
     * point: its end by the point, then its end by the hand, read from the
     * edge affordance's centre and `length` (a sword's true edge, the length
     * of its blade). Null when the tool declares no such edge: its working
     * point is then all that strikes (a racket's `sweetSpot`, a club's
     * `strike`, the bare hand's grip).
     */
    span: readonly [number, number] | null;

    /** The prop as the hand holds it; absent for the bare hand. */
    held?: IAutoMovieMotionHumanHeld.IHeld;

    /** What the plan publishes of the held tool; absent for the bare hand. */
    wields?: IAutoMovieMotionHumanActionPlan.ITool;
  }

  /**
   * A hand's grip frame in the world: the grip socket's point and the hand bone's rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: The grip socket, world metres.
   * @evidence contracts/development/design.md#principled-representation point: The grip socket, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanFirearmReady.ts (HumanFirearmReady.pose, return); lexicon/HumanFirearmReady.ts (HumanFirearmReady.pose.frame, return); lexicon/HumanSword.ts (HumanSword.cut.path, return); lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard, return); lexicon/HumanSwordLanding.ts (HumanSwordLanding.frame, return); lexicon/HumanSwordLanding.ts (HumanSwordLanding.frame.leaning, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IHandFrame {
    /** The grip socket, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }
}
