import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanHeld } from "../compose/IAutoMovieMotionHumanHeld";
import type { IAutoMovieMotionWieldedTool } from "../law/IAutoMovieMotionWieldedTool";

/**
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
export namespace IAutoMovieMotionHumanStrikingHeld {
  /** The affordance ids read of a prop. */
  export interface IPoints {
    /** The working point's affordance, whose `+Y` runs out of the tool. */
    tip: string;

    /**
     * The affordance the working line runs from toward `tip`; absent, the
     * point's declared direction supplies the line. Surface normals keep their
     * contact meaning.
     */
    from?: string;

    /**
     * The affordance whose `+Y` is the edge's direction; absent, any direction
     * square to the axis.
     */
    edge?: string;
  }

  /** A held thing in the hand's grip frame. */
  export interface ITool {
    /** The prop's subject id; absent when the bare hand is the effector. */
    prop?: string;

    /** The holding hand. */
    side: AutoMovieHumanSide;

    /** The working point from the grip socket, in the hand bone's frame, metres. */
    tip: IAutoMovieVector3;

    /** The unit direction the tool runs toward its working point, hand frame. */
    axis: IAutoMovieVector3;

    /**
     * The unit direction the tool cuts or sights along, square to the axis,
     * hand frame.
     */
    edge: IAutoMovieVector3;

    /**
     * Whether the tool has no edge of its own: a prop that declares no edge
     * affordance (a bat, a club), whose `edge` is then only a direction square
     * to the axis, so its roll about its own line is free to the arm. False for
     * the bare hand, whose edge is the little finger's side.
     */
    rolls: boolean;

    /**
     * The working length behind the point along the axis, metres: the distance
     * from an explicit `from`, otherwise the grip's projection behind the tip;
     * 0 for the bare hand.
     */
    length: number;

    /**
     * The run of the tool's edge along its axis, metres behind the working
     * point: its end by the point, then its end by the hand, read from the edge
     * affordance's centre and `length` (a sword's true edge, the length of its
     * blade). Null when the tool declares no such edge: its working point is
     * then all that strikes (a racket's `sweetSpot`, a club's `strike`, the
     * bare hand's grip).
     */
    span: readonly [number, number] | null;

    /** The prop as the hand holds it; absent for the bare hand. */
    held?: IAutoMovieMotionHumanHeld.IHeld;

    /** What the plan publishes of the held tool; absent for the bare hand. */
    wields?: IAutoMovieMotionWieldedTool;
  }

  /**
   * A hand's grip frame in the world: the grip socket's point and the hand
   * bone's rotation.
   */
  export interface IHandFrame {
    /** The grip socket, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }
}
