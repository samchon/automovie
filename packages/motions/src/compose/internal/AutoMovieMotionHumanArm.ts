import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmAngles,
  IAutoMoviePose,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmCarry } from "./AutoMovieMotionHumanArmCarry";
import { AutoMovieMotionHumanArmMove } from "./AutoMovieMotionHumanArmMove";
import { AutoMovieMotionHumanArmPhrase } from "./AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanArmTarget } from "./AutoMovieMotionHumanArmTarget";

/*
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
 * (`HumanPosture.IGoal.contact`).
 *
 * Between its origin and its target the surface moves on a straight path, or
 * one that bows to the arm's own side when the movement states a curvature, and
 * the hand turns by spherical interpolation, both by one weight, and the
 * fingers go from the relaxed cascade to the target's shape by the same weight
 * (Jeannerod 1984: the hand is shaped during its transport). The origin is held
 * in the performer's own floor frame, so it follows the body.
 */
export namespace AutoMovieMotionHumanArm {
  /*
   * AutoMovieMotionHumanArmTarget.origin.
   */
  export const origin: typeof AutoMovieMotionHumanArmTarget.origin =
    AutoMovieMotionHumanArmTarget.origin;

  /*
   * AutoMovieMotionHumanArmTarget.point.
   */
  export const point: typeof AutoMovieMotionHumanArmTarget.point =
    AutoMovieMotionHumanArmTarget.point;

  /*
   * AutoMovieMotionHumanArmTarget.goal.
   */
  export const goal: typeof AutoMovieMotionHumanArmTarget.goal =
    AutoMovieMotionHumanArmTarget.goal;

  /*
   * Fixed-geometry goal producer owned by
   * AutoMovieMotionHumanArmTarget.prepareGoal.
   */
  export const prepareGoal: typeof AutoMovieMotionHumanArmTarget.prepareGoal =
    AutoMovieMotionHumanArmTarget.prepareGoal;

  /*
   * AutoMovieMotionHumanArmAngles.angles.
   */
  export const angles: typeof AutoMovieMotionHumanArmAngles.angles =
    AutoMovieMotionHumanArmAngles.angles;

  /*
   * The pose an action is entered with, as a course reads it.
   */
  export interface IEntry {
    /*
     * The displayed pose at the action's entry.
     */
    pose: IAutoMoviePose;
  }

  /*
   * What carries an action's entry: an action's context, or a stated pose.
   */
  export interface IEntered {
    /*
     * The entry.
     */
    entry: IEntry;
  }

  /*
   * An arm's angles as its action is entered: the one entry arm record every
   * course leaves from unless its law states another rest, so a course plans
   * from the entry state (transitions.md, "Carry resolved entry state through
   * cuts"; "Plan the target action from that entry state").
   * Parameter context: What carries the entry.
   * Parameter side: The arm.
   * Returns: The arm's angles in the entry pose.
   */
  export function entered(
    context: IEntered,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanArmAngles.IAngles {
    return AutoMovieMotionHumanArmAngles.angles(context.entry.pose, side);
  }

  /*
   * AutoMovieMotionHumanArmCarry.carry.
   */
  export const carry: typeof AutoMovieMotionHumanArmCarry.carry =
    AutoMovieMotionHumanArmCarry.carry;

  /*
   * AutoMovieMotionHumanArmCarry.carried.
   */
  export const carried: typeof AutoMovieMotionHumanArmCarry.carried =
    AutoMovieMotionHumanArmCarry.carried;

  /*
   * AutoMovieMotionHumanArmPlanned.stated.
   */
  export const stated: typeof AutoMovieMotionHumanArmPlanned.stated =
    AutoMovieMotionHumanArmPlanned.stated;

  /*
   * AutoMovieMotionHumanArmPlanned.together.
   */
  export const together: typeof AutoMovieMotionHumanArmPlanned.together =
    AutoMovieMotionHumanArmPlanned.together;

  /*
   * AutoMovieMotionHumanArmMove.move.
   */
  export const move: typeof AutoMovieMotionHumanArmMove.move =
    AutoMovieMotionHumanArmMove.move;

  /*
   * AutoMovieMotionHumanArmMove.reach.
   */
  export const reach: typeof AutoMovieMotionHumanArmMove.reach =
    AutoMovieMotionHumanArmMove.reach;

  /*
   * AutoMovieMotionHumanArmMove.hold.
   */
  export const hold: typeof AutoMovieMotionHumanArmMove.hold =
    AutoMovieMotionHumanArmMove.hold;

  /*
   * AutoMovieMotionHumanArmMove.retract.
   */
  export const retract: typeof AutoMovieMotionHumanArmMove.retract =
    AutoMovieMotionHumanArmMove.retract;

  /*
   * AutoMovieMotionHumanArmPhrase.bearing.
   */
  export const bearing: typeof AutoMovieMotionHumanArmPhrase.bearing =
    AutoMovieMotionHumanArmPhrase.bearing;

  /*
   * AutoMovieMotionHumanArmPhrase.visit.
   */
  export const visit: typeof AutoMovieMotionHumanArmPhrase.visit =
    AutoMovieMotionHumanArmPhrase.visit;

  /*
   * AutoMovieMotionHumanArmPhrase.stroke.
   */
  export const stroke: typeof AutoMovieMotionHumanArmPhrase.stroke =
    AutoMovieMotionHumanArmPhrase.stroke;

  /*
   * AutoMovieMotionHumanArmPhrase.strike.
   */
  export const strike: typeof AutoMovieMotionHumanArmPhrase.strike =
    AutoMovieMotionHumanArmPhrase.strike;

  /*
   * AutoMovieMotionHumanArmPhrase.oscillate.
   */
  export const oscillate: typeof AutoMovieMotionHumanArmPhrase.oscillate =
    AutoMovieMotionHumanArmPhrase.oscillate;

  /*
   * AutoMovieMotionHumanArmPhrase.swing.
   */
  export const swing: typeof AutoMovieMotionHumanArmPhrase.swing =
    AutoMovieMotionHumanArmPhrase.swing;
}
