import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * Arm primitives: a hand surface carried to a target, kept on it and taken
 * back.
 *
 * A target is a frame evaluated at each second on the posture the action has so
 * far (a region of the performer's own trunk, a partner's hand, a prop, a point
 * of the world), so the same row fits every body and follows whatever the
 * target rides on. The hand is an effector goal solved by the arm's inverse
 * kinematics: the goal carries the surface as its contact, so where the arm
 * cannot turn the hand as asked the resolver re-aims the wrist until the
 * surface stays on its point and the rotation gives way
 * (`IAutoMovieHumanLimbGoal.contact`).
 *
 * Between its origin and its target the surface moves on a straight path, or
 * one that bows to the arm's own side when the movement states a curvature, and
 * the hand turns by spherical interpolation, both by one weight, and the
 * fingers go from the relaxed cascade to the target's shape by the same weight
 * (Jeannerod 1984: the hand is shaped during its transport). The origin is held
 * in the performer's own floor frame, so it follows the body.
 */
export namespace IAutoMovieMotionHumanArmTarget {
  /** Where a hand surface goes and how the hand is held there, world frame. */
  export interface ITarget {
    /** The surface brought to the point. */
    surface: IAutoMovieMotionHumanHand.Surface;

    /** The hand shape held at the target. */
    shape: IAutoMovieMotionHumanHand.Shape;

    /** Where the surface goes, world metres. */
    point: IAutoMovieVector3;

    /** The hand's asked world rotation from its rest. */
    rotation: IAutoMovieQuaternion;

    /** The elbow's bend hint, world metres. */
    bend: IAutoMovieVector3;

    /**
     * Extra flexion of every finger joint over the shape, degrees; 0 when
     * absent.
     */
    curl?: number;

    /**
     * The surface's offset from the wrist under the shape, hand-local metres,
     * when the row's issuer read it once for every row of one body, side,
     * surface and shape (`AutoMovieMotionHumanArmTarget.prepareTarget`); read
     * from the hand when absent. A row that changes its surface or shape drops
     * it.
     */
    offset?: IAutoMovieVector3;
  }

  /** A target with the arm that takes it. */
  export interface ISided extends IAutoMovieMotionHumanArmTarget.ITarget {
    /** The arm. */
    side: AutoMovieHumanSide;
  }

  /**
   * A target as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @param resolution Optional same-body FK metadata borrowed only during this
   *   target invocation.
   * @param projection Optional genuine same-body ROM projector borrowed only
   *   during this invocation.
   * @param evaluation The explicit context of the evaluation the target is read
   *   in, the arm primitive's own; never retained.
   * @returns The target.
   */
  export type Frame = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    evaluation?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[4],
  ) => IAutoMovieMotionHumanArmTarget.ITarget;

  /**
   * Where a hand is before or after its movement, in the performer's floor
   * frame.
   */
  export interface IOrigin {
    /** The surface's point; `x` left, `y` up, `z` forward of the root, metres. */
    point: IAutoMovieVector3;

    /** The hand's rotation from its rest, relative to the heading. */
    rotation: IAutoMovieQuaternion;
  }

  /** One arm's movement. */
  export interface IMove {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** Seconds since the action's start from which the arm is written. */
    from: number;

    /** Seconds since the action's start until which the arm is written. */
    to: number;

    /** Where the hand is at weight 0. */
    origin: IAutoMovieMotionHumanArmTarget.IOrigin;

    /** Where the hand is at weight 1. */
    target: IAutoMovieMotionHumanArmTarget.Frame;

    /**
     * How far the hand is from its origin to its target.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     */
    weight(seconds: number): number;

    /**
     * How far the path between the origin and the target bows out to the arm's
     * own side at its middle, a share of the path's length; 0 when absent, a
     * straight path.
     */
    curvature?: number;
  }
}
