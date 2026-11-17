import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * Arm primitives: a hand surface carried to a target, kept on it and taken
 * back.
 *
 * A target is a frame evaluated at each second on the posture the action has
 * so far (a region of the performer's own trunk, a partner's hand, a prop, a
 * point of the world), so the same row fits every body and follows whatever
 * the target rides on. The hand is an effector goal solved by the arm's
 * inverse kinematics: the goal carries the surface as its contact, so where
 * the arm cannot turn the hand as asked the resolver re-aims the wrist until
 * the surface stays on its point and the rotation gives way
 * (`IAutoMovieMotionHumanPosture.IGoal.contact`).
 *
 * Between its origin and its target the surface moves on a straight path,
 * or one that bows to the arm's own side when the movement states a
 * curvature, and the hand turns by spherical interpolation, both by one
 * weight, and the
 * fingers go from the relaxed cascade to the target's shape by the same
 * weight (Jeannerod 1984: the hand is shaped during its transport). The
 * origin is held in the performer's own floor frame, so it follows the body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation fingers: The fingers' joints of that hand as the arm holds them, read off the pose with the arm; the posture's own when absent.
 * @evidence contracts/development/design.md#principled-representation fingers: The fingers' joints of that hand as the arm holds them, read off the pose with the arm; the posture's own when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanArmAngles.ts (AutoMovieMotionHumanArmAngles.angles, return); compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carry, from); compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carry.reading, fingers); compose/AutoMovieMotionHumanArmPlanned.ts (AutoMovieMotionHumanArmPlanned.planned.guesses, return); everyday/braceOnThigh.ts (braceOnThigh, rest); everyday/gestureHands.ts (gestureHands.planned, begin).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanArmAngles {
  /**
   * One arm's joint angles: the clinical flexion, abduction and twist of the
   * upper arm, the forearm and the hand, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which joints are held, the order of each triple and the unit.
   * @evidence contracts/development/design.md#principled-representation An arm that travels freely is described by its joint angles, the coordinates a free arm movement is smooth in (Soechting and Lacquaniti 1981).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, the three joints the arm channel owns; read by `angles` and `carry`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each triple is the posture's own joint triple, so it is written back without conversion.
   */
  export interface IAngles {
    /** The upper arm's flexion, abduction and twist. */
    upper: readonly [number, number, number];

    /** The forearm's flexion, abduction and twist. */
    lower: readonly [number, number, number];

    /** The hand's flexion, abduction and twist. */
    hand: readonly [number, number, number];

    /** The fingers' joints of that hand as the arm holds them, read off the pose with the arm; the posture's own when absent. */
    fingers?: Readonly<
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >;
  }
}
