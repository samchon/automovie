import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * The one owner of goals in a moving support's frame: a posture planned in the
 * world at an action's start, expressed in the support's frame there and
 * carried back to the world at every second by the support's rigid motion since
 * then. A stance on a cart's bed, a bow held on its target from a cantering
 * horse and a carbine presented from a moving car all plan once at their start
 * and are carried this way, so a goal on the support stays on it and the plan
 * stays a pure function of its seconds.
 *
 * The carry is the rigid transform `D(t) = F(t) F(start)^-1` of the support's
 * frame `F`: a point `p` goes to `F(t) F(start)^-1 p`, a rotation is turned by
 * the support's turn, and the heading by that turn's yaw about the vertical. A
 * goal attached to a bone (`IAutoMovieHumanLimbGoal.on`) rides its bone already
 * and is left alone. On the ground the carry is the identity, so nothing
 * changes there.
 */
export namespace IAutoMovieMotionHumanSupportCarry {
  /** A support's rigid motion since a start. */
  export interface ICarry {
    /** A world point at the start, where the support has carried it. */
    point(p: IAutoMovieVector3): IAutoMovieVector3;

    /** The support's turn since the start. */
    turn: IAutoMovieQuaternion;

    /** That turn's yaw about the vertical, degrees. */
    yaw: number;
  }
}
