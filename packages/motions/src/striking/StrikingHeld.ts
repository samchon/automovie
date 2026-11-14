import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

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
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, when, in which frame, and what stands in when no prop is held.
 * @evidence contracts/development/design.md#principled-representation A held thing is a rigid offset in the hand's frame (inverse(hand) times object, captured once), the parent constraint of the motion skill's held-object rule.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tool record, its reading, the hand goal that places it, where it is on a hand frame, and the grip windows that keep it held; read by the blade and firearm lexicons.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop kind is named: the points are affordance ids the caller gives, and a missing one is refused with the ids the prop has.
 */
export namespace StrikingHeld {
  /** A held thing in the hand's grip frame. */
  export interface ITool {
    /** The prop's subject id; absent when the bare hand is the effector. */
    prop?: string;

    /** The holding hand. */
    side: HumanHand.Side;

    /** The working point from the grip socket, in the hand bone's frame, metres. */
    tip: IAutoMovieVector3;

    /** The unit direction the tool runs toward its working point, hand frame. */
    axis: IAutoMovieVector3;

    /** The unit direction the tool cuts or sights along, square to the axis, hand frame. */
    edge: IAutoMovieVector3;

    /** Whether the tool has no edge of its own: a prop that declares no edge affordance (a bat, a club), whose `edge` is then only a direction square to the axis, so its roll about its own line is free to the arm. False for the bare hand, whose edge is the little finger's side. */
    rolls: boolean;

    /** The working length behind the point along the axis, metres: a blade's length, a barrel's; 0 for the bare hand. */
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
    held?: AutoMovieMotionHumanHeld.IHeld;

    /** What the plan publishes of the held tool; absent for the bare hand. */
    wields?: IHumanActionPlan.ITool;
  }

  /** The affordance ids read of a prop. */
  export interface IPoints {
    /** The working point's affordance, whose `+Y` runs out of the tool. */
    tip: string;

    /** The affordance whose `+Y` is the edge's direction; absent, any direction square to the axis. */
    edge?: string;
  }

  /** A hand's grip frame in the world: the grip socket's point and the hand bone's rotation. */
  export interface IHandFrame {
    /** The grip socket, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * Read what a hand holds at an action's entry.
   *
   * @param context The action's context.
   * @param side The holding hand.
   * @param prop The held prop's subject id; absent for the bare hand.
   * @param points The affordances that mark its working point and edge; a blade's `point` and `edge` when absent.
   * @returns The tool in the hand's frame.
   * @throws {HumanRefusal} When the prop lacks the working point's affordance, listing the ones it has.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, the result's frame and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The prop's displayed frame at the entry second taken into the displayed hand's grip frame, the offset the performance itself keeps while the grip holds; an affordance's translation is its point and its rotated `+Y` its outward direction; the tool's line is that `+Y` where the archetype declares it along the tool, and the line from the grip to the working point where it declares a face's normal (`IAutoMovieAffordance.direction`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The bare hand first, then one change of frame for the point, the axis and the edge.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A prop without the named point is refused; an edge that is missing or parallel to the axis is replaced by a direction square to the axis, stated in `IPoints`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One forward kinematics of the entry pose and a scan of the prop's affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    context: Pick<IHumanActionContext, "body" | "entry" | "prop" | "subject">,
    side: HumanHand.Side,
    prop?: string,
    points: IPoints = { tip: "point", edge: "edge" },
  ): ITool {
    if (prop === undefined) {
      const grip: HumanHand.IFrame = HumanHand.offset(
        context.body,
        side,
        "grip",
      );
      const axis: IAutoMovieVector3 = {
        x: side === "left" ? 1 : -1,
        y: 0,
        z: 0,
      };
      return {
        side,
        tip: { x: 0, y: 0, z: 0 },
        axis,
        edge: square(axis, Vector3.scale(grip.forward, -1)),
        rolls: false,
        length: 0,
        span: null,
      };
    }
    // The prop as the hand holds it, read by the one owner of that frame.
    const held: AutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      side,
      prop,
    );
    const tip: { point: IAutoMovieVector3; direction: IAutoMovieVector3 } =
      AutoMovieMotionHumanHeld.point(held, points.tip);
    // The tool's line runs from the grip to its working point. A working
    // affordance whose +Y the archetype declares along the tool (a muzzle, a
    // sword's point) gives it; one whose +Y is a face's normal (a club's
    // strike) gives only the point, and the line is the grip's to it.
    const axis: IAutoMovieVector3 =
      held.affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === points.tip,
      )?.direction === "normal"
        ? Vector3.normalize(tip.point)
        : Vector3.normalize(tip.direction);
    const edged:
      | { point: IAutoMovieVector3; direction: IAutoMovieVector3 }
      | undefined =
      points.edge !== undefined &&
      held.affordances.some(
        (a: IAutoMovieAffordance): boolean => a.id === points.edge,
      )
        ? AutoMovieMotionHumanHeld.point(held, points.edge)
        : undefined;
    const run: number | undefined = held.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === points.edge,
    )?.length;
    const length: number = Math.max(0, Vector3.dot(tip.point, axis));
    return {
      prop,
      side,
      tip: tip.point,
      axis,
      edge: square(axis, edged?.direction ?? { x: 0, y: 1, z: 0 }),
      rolls: edged === undefined,
      length,
      span:
        edged === undefined || run === undefined
          ? null
          : [
              Vector3.dot(Vector3.subtract(tip.point, edged.point), axis) -
                run / 2,
              Vector3.dot(Vector3.subtract(tip.point, edged.point), axis) +
                run / 2,
            ],
      held,
      wields: {
        prop,
        side,
        tip: points.tip,
        ...(edged !== undefined && points.edge !== undefined
          ? { edge: points.edge }
          : {}),
      },
    };
  }

  /**
   * The hand frame that puts a point of the tool on a world point with the
   * tool turned as asked.
   *
   * @param tool The tool.
   * @param back How far behind the working point the placed point lies along the axis, metres; 0 places the working point itself.
   * @param at Where that point goes, world metres.
   * @param axis The world direction the tool runs; any non-zero vector.
   * @param edge The world direction its edge faces; only its part square to the axis counts.
   * @returns The hand's grip frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's frame and unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The rotation that carries the tool's axis and edge in the hand onto the asked world pair (`HumanHand.align`), then the grip socket placed back from the point by the rotated offset: the rigid relation of an effector offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One alignment and one subtraction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An edge parallel to the axis is squared against the world's up or forward instead of throwing, since a thrust states no edge.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function hand(
    tool: ITool,
    back: number,
    at: IAutoMovieVector3,
    axis: IAutoMovieVector3,
    edge: IAutoMovieVector3,
  ): IHandFrame {
    const along: IAutoMovieVector3 = Vector3.normalize(axis);
    const rotation: IAutoMovieQuaternion = HumanHand.align(
      { normal: tool.axis, forward: tool.edge },
      { normal: along, forward: square(along, edge) },
    );
    return {
      rotation,
      point: Vector3.subtract(
        at,
        Quaternion.rotateVector(rotation, placed(tool, back)),
      ),
    };
  }

  /**
   * A point of the tool in the world on a hand frame.
   *
   * @param tool The tool.
   * @param frame The hand's grip frame.
   * @param back How far behind the working point along the axis, metres.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result's frame.
   * @evidence contracts/development/implementation.md#principled-implementation The grip socket plus the rotated offset, the inverse of `hand`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rigid transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function point(
    tool: ITool,
    frame: IHandFrame,
    back: number = 0,
  ): IAutoMovieVector3 {
    return Vector3.add(
      frame.point,
      Quaternion.rotateVector(frame.rotation, placed(tool, back)),
    );
  }

  /**
   * The arm goal that holds the tool on a hand frame, turning about a point
   * of the tool.
   *
   * @param context The body.
   * @param tool The tool.
   * @param frame The hand's grip frame asked.
   * @param back The point of the tool that must stay where the frame puts it, metres behind the working point.
   * @param bend The elbow's bend hint, world metres.
   * @returns The goal for the holding arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the goal holds and which point stays when the turn gives way.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist follows rigidly from the grip socket and the hand's rotation; the goal's contact is the kept point's offset from the wrist in the hand's frame, so the posture resolver re-aims the wrist to keep that point when the wrist's range cannot give the rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrist placement and one offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goal is planted, as a gripping hand's is, so a transition never slides the tool.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function goal(
    context: Pick<IHumanActionContext, "body">,
    tool: ITool,
    frame: IHandFrame,
    back: number,
    bend: IAutoMovieVector3,
  ): IHumanPosture.IGoal {
    const grip: IAutoMovieVector3 = HumanHand.offset(
      context.body,
      tool.side,
      "grip",
    ).point;
    return {
      point: Vector3.subtract(
        frame.point,
        Quaternion.rotateVector(frame.rotation, grip),
      ),
      rotation: frame.rotation,
      bend,
      contact: Vector3.add(grip, placed(tool, back)),
      ...(tool.prop === undefined ? {} : { planted: true }),
    };
  }

  /**
   * The grip window that keeps a held prop in its hand through an action;
   * none for the bare hand.
   *
   * @param tool The tool.
   * @returns The contact windows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the window does and when there is none.
   * @evidence contracts/development/implementation.md#principled-implementation A held prop stays held across actions only while each action that drives its hand declares a grip on it, the performance's rule; the window spans the whole action.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function grips(tool: ITool): IHumanContactWindow[] {
    return tool.held === undefined
      ? []
      : [AutoMovieMotionHumanHeld.grip(tool.held)];
  }

  /**
   * The hold a held prop is left in when the action ends, with the fingers
   * the hand had closed on it at the entry; none for the bare hand.
   *
   * @param context The action's context.
   * @param tool The tool.
   * @returns The holds for the plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is left held, with which fingers, and when there is none.
   * @evidence contracts/development/implementation.md#principled-implementation The action takes the hand over by its grip window, which ends the earlier hold, so it leaves a hold of its own from its start; the fingers are the displayed ones, which the grip closed until contact.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fingers are read from the entry pose, never re-closed, so the hand does not re-seat what it holds.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One scan of the entry pose's joints.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function holds(
    context: Pick<IHumanActionContext, "entry">,
    tool: ITool,
  ): IHumanActionPlan.IHold[] {
    return tool.held === undefined
      ? []
      : [AutoMovieMotionHumanHeld.hold(context, tool.held)];
  }

  /** A point of the tool from the grip socket, hand frame. */
  const placed = (tool: ITool, back: number): IAutoMovieVector3 =>
    Vector3.subtract(tool.tip, Vector3.scale(tool.axis, back));

  /** The unit part of a direction square to an axis; a fallback square to it when they are parallel. */
  const square = (
    axis: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    for (const candidate of [
      direction,
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
    ]) {
      const across: IAutoMovieVector3 = Vector3.subtract(
        candidate,
        Vector3.scale(axis, Vector3.dot(candidate, axis)),
      );
      if (Vector3.length(across) > 1e-6) return Vector3.normalize(across);
    }
    return { x: 1, y: 0, z: 0 };
  };
}
