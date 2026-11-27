import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { HumanHand } from "../../posture/internal/HumanHand";
import { StrikingHeldFrame } from "./StrikingHeldFrame";
import { StrikingHeldGoal } from "./StrikingHeldGoal";

/*
 * Read what a hand holds at an action's entry.
 * Parameter context: The action's context.
 * Parameter side: The holding hand.
 * Parameter prop: The held prop's subject id; absent for the bare hand.
 * Parameter points: The working point, optional working-line origin and edge; a
 * blade's `point` and `edge` when absent.
 * Returns: The tool in the hand's frame.
 * When a named affordance is absent, listing the ones it
 * has, or named working-line endpoints coincide.
 */
export function StrikingHeld(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  side: AutoMovieHumanSide,
  prop?: string,
  points: IAutoMovieMotionHumanStrikingHeld.IPoints = {
    tip: "point",
    edge: "edge",
  },
): IAutoMovieMotionHumanStrikingHeld.ITool {
  if (prop === undefined) return StrikingHeld.bare(context.body, side);
  // The prop as the hand holds it, read by the one owner of that frame.
  return StrikingHeld.read(
    AutoMovieMotionHumanHeld(context, side, prop),
    points,
  );
}

/*
 * A thing held in the hand as the effector of an action: a blade whose point
 * and edge are aimed, a firearm whose muzzle is aimed.
 *
 * A held prop is rigid in the hand from the instant the grip closed, so its
 * working point (a sword's point, a muzzle), its axis (the way the blade or the
 * barrel runs) and its edge (the way a blade cuts, a barrel's top) are
 * constants of the hand's frame for as long as it is held. This reads them once
 * at the action's entry, from where the prop is displayed and where the hand is
 * displayed, so the law aims the same thing the performance shows whichever way
 * the hand took the prop. With no prop named the hand itself is the effector:
 * the grip's centre, its line the hand's own from the wrist to the knuckles,
 * its edge the little finger's side, as a knife-hand cuts.
 *
 * The frame is the performance's own grip frame: the grip socket's point with
 * the hand bone's rotation. A goal built here puts the working point, not the
 * wrist, on its place: the goal's contact is the working point, so where the
 * wrist cannot turn the hand as asked the point stays and the turn gives way.
 */
export namespace StrikingHeld {
  /*
   * The cancel table of an action whose effector is a held tool: anything may
   * follow from the named instant on, blended in by inertialization, the grip
   * kept so the tool stays in the hand.
   * Parameter instant: The event from which a follow-up may cut in.
   * Returns: The table.
   */
  export const follows = (
    instant: string,
  ): IAutoMovieMotionHumanActionLaw["interrupts"] => ({
    any: [
      {
        window: { start: instant, end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: 0.15,
        keep: ["grip"],
      },
    ],
  });

  /*
   * A bare hand as the tool: its grip socket, wrist-to-knuckle axis and
   * little-finger side, without reading an entry or a held prop.
   * Parameter body: The body whose grip socket supplies the hand's axes.
   * Parameter side: The hand.
   * Returns: The bare tool in the hand's grip frame.
   */
  export function bare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanStrikingHeld.ITool {
    const grip: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
      body,
      side,
      "grip",
    );
    const axis: IAutoMovieVector3 = { x: side === "left" ? 1 : -1, y: 0, z: 0 };
    return {
      side,
      tip: { x: 0, y: 0, z: 0 },
      axis,
      edge: square(axis, AutoMovieEngineVector3.scale(grip.forward, -1)),
      rolls: false,
      length: 0,
      span: null,
    };
  }

  /*
   * The tool a held prop is, in the hand's grip frame: what `of` reads at an
   * action's entry, and what a grasp not yet taken would hold (a pick-up's
   * candidate grip, its prop's frame in that grip).
   * Parameter held: The prop in the hand's grip frame.
   * Parameter points: The working point, optional working-line origin and edge; a
   * blade's `point` and `edge` when absent.
   * Returns: The tool in the hand's frame.
   * When a named affordance is absent, listing the ones
   * it has, or named working-line endpoints coincide.
   */
  export function read(
    held: IAutoMovieMotionHumanHeld.IHeld,
    points: IAutoMovieMotionHumanStrikingHeld.IPoints = {
      tip: "point",
      edge: "edge",
    },
  ): IAutoMovieMotionHumanStrikingHeld.ITool {
    return StrikingHeldFrame.read(held, points);
  }

  /*
   * The hand frame that puts a point of the tool on a world point with the tool
   * turned as asked.
   * Parameter tool: The tool.
   * Parameter back: How far behind the working point the placed point lies along
   * the axis, metres; 0 places the working point itself.
   * Parameter at: Where that point goes, world metres.
   * Parameter axis: The world direction the tool runs; any non-zero vector.
   * Parameter edge: The world direction its edge faces; only its part square to the
   * axis counts.
   * Returns: The hand's grip frame.
   */
  export function hand(
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    back: number,
    at: IAutoMovieVector3,
    axis: IAutoMovieVector3,
    edge: IAutoMovieVector3,
  ): IAutoMovieMotionHumanStrikingHeld.IHandFrame {
    const rotation: IAutoMovieQuaternion = alignment(tool, axis, edge);
    return {
      rotation,
      point: AutoMovieEngineVector3.subtract(
        at,
        AutoMovieEngineQuaternion.rotateVector(rotation, placed(tool, back)),
      ),
    };
  }

  /*
   * Prepare the rigid hand rotation and kept-point offset for a fixed tool
   * orientation, then place fresh hand frames at changing world points.
   * Parameter tool: The unchanged held tool's hand-local axis, edge and working
   * point.
   * Parameter back: The kept point's distance behind its working point, metres.
   * Parameter axis: The unchanged nonzero world line.
   * Parameter edge: The unchanged world edge direction, squared by hand's existing
   * rule.
   * Returns: A world-point reader with independent position and rotation
   * outputs.
   */
  export function prepareHand(
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    back: number,
    axis: IAutoMovieVector3,
    edge: IAutoMovieVector3,
  ): (at: IAutoMovieVector3) => IAutoMovieMotionHumanStrikingHeld.IHandFrame {
    const rotation: IAutoMovieQuaternion = alignment(tool, axis, edge);
    const offset: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      rotation,
      placed(tool, back),
    );
    return (
      at: IAutoMovieVector3,
    ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => ({
      rotation: { ...rotation },
      point: AutoMovieEngineVector3.subtract(at, offset),
    });
  }

  /*
   * A point of the tool in the world on a hand frame.
   * Parameter tool: The tool.
   * Parameter frame: The hand's grip frame.
   * Parameter back: How far behind the working point along the axis, metres.
   * Returns: World metres.
   */
  export function point(
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    back: number = 0,
  ): IAutoMovieVector3 {
    return AutoMovieEngineVector3.add(
      frame.point,
      AutoMovieEngineQuaternion.rotateVector(frame.rotation, placed(tool, back)),
    );
  }

  /*
   * How far the tool on one hand frame lies from itself on another: the greater
   * of the displacements of the point it keeps and of its working point; a pose
   * that keeps the working point itself reads the line at the tool's own length
   * in place of the kept point, so a tool that keeps its point and points
   * elsewhere is counted.
   * Parameter tool: The tool.
   * Parameter fitted: The hand frame the arm reaches.
   * Parameter asked: The hand frame asked.
   * Parameter back: The point the pose keeps, metres behind the working point.
   * Returns: Metres.
   */
  export function strayed(
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    fitted: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    asked: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    back: number,
  ): number {
    const off = (behind: number): number =>
      AutoMovieEngineVector3.distance(point(tool, fitted, behind), point(tool, asked, behind));
    return Math.max(off(back > 0 ? back : tool.length), off(0));
  }

  /*
   * The arm goal that holds the tool on a hand frame, turning about a point of
   * the tool.
   * Parameter context: The body.
   * Parameter tool: The tool.
   * Parameter frame: The hand's grip frame asked.
   * Parameter back: The point of the tool that must stay where the frame puts it,
   * metres behind the working point.
   * Parameter bend: The elbow's place where no place of the arm is legal, world
   * metres; elsewhere the elbow is left to the body
   * (`HumanPosture.IGoal.elbow`).
   * Returns: The goal for the holding arm, with both working-line points
   * bounded by the same miss the action judges.
   */
  export function goal(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    back: number,
    bend: IAutoMovieVector3,
  ): IAutoMovieHumanLimbGoal {
    return StrikingHeldGoal.goal(context, tool, frame, back, bend);
  }

  /*
   * Prepare a fixed held tool's hand-local goal geometry for candidate frames.
   * Parameter context: The unchanged canonical body.
   * Parameter tool: The unchanged held tool and hand side.
   * Parameter back: Metres behind the working point of the kept point.
   * Returns: A goal reader of the actual world hand frame and fallback bend;
   * mutable contact/limit records are fresh, rotation/bend borrow the
   * original inputs.
   */
  export function prepareGoal(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    back: number,
  ): (
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    bend: IAutoMovieVector3,
  ) => IAutoMovieHumanLimbGoal {
    return StrikingHeldGoal.prepare(context, tool, back);
  }

  /*
   * The grip window that keeps a held prop in its hand through an action; none
   * for the bare hand.
   * Parameter tool: The tool.
   * Returns: The contact windows.
   */
  export function grips(
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  ): IAutoMovieMotionHumanContactWindow[] {
    return tool.held === undefined
      ? []
      : [AutoMovieMotionHumanHeld.grip(tool.held)];
  }

  /*
   * The hold a held prop is left in when the action ends, with the fingers the
   * hand had closed on it at the entry; none for the bare hand.
   * Parameter context: The action's context.
   * Parameter tool: The tool.
   * Returns: The holds for the plan.
   */
  export function holds(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  ): IAutoMovieMotionPropHold[] {
    return tool.held === undefined
      ? []
      : [AutoMovieMotionHumanHeld.hold(context, tool.held)];
  }

  /*
   * The same normalized rigid alignment for one-shot and fixed-orientation
   * placements.
   */
  function alignment(
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    axis: IAutoMovieVector3,
    edge: IAutoMovieVector3,
  ): IAutoMovieQuaternion {
    const along: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(axis);
    return HumanHand.align(
      { normal: tool.axis, forward: tool.edge },
      { normal: along, forward: square(along, edge) },
    );
  }

  /*
   * A point of the tool from the grip socket, hand frame.
   */
  const placed = (
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    back: number,
  ): IAutoMovieVector3 => StrikingHeldGoal.offset(tool, back);

  /*
   * The perpendicular axis construction shared with the held-point reader.
   */
  const square: typeof StrikingHeldFrame.square = StrikingHeldFrame.square;
}

/*
 * The alternatives of `OfContext`'s site.
 */
type OfContext = "body" | "entry" | "prop" | "subject";
