/**
 * The room a forearm needs beside its own trunk and beside the other arm.
 *
 * The other arm's room is the far side of the chest's median plane: an elbow
 * crosses it only as far as its wrist's goal does.
 *
 * A hand goal fixes the wrist and leaves the elbow free on a circle. An
 * elbow place whose point is outside the trunk can still run the forearm
 * through it, so the forearm is judged along its whole length: its axis,
 * sampled from the elbow toward the wrist, keeps the forearm's radius from
 * the colliders of the trunk, the neck and the head at the elbow, tapering to
 * the wrist's own clearance at the wrist, where the palm lies on the surface
 * the hand was sent to. The limb fit, which places the legs before the arms,
 * judges the thighs too (`obstacles`); a caller that poses only the trunk
 * judges the trunk alone (`trunk`).
 *
 * An arm that is not fitted to a goal but carried in joint space between two
 * arms has no elbow place to choose and no goal under its wrist; it is read
 * whole (`room`), against another body's colliders too when one stands in its
 * way, and its elbow let out or folded until the forearm asks no more room
 * than the carry's two ends hold (`cleared`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation forearm: The forearm's needed room `overshoot` reads, degrees. segments: The arm's segments' depth the tangle audit reads, degrees.
 * @evidence contracts/development/design.md#principled-representation forearm: The forearm's needed room `overshoot` reads, degrees. segments: The arm's segments' depth the tangle audit reads, degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carry.plain, return); compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carry.plan, return); compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carry.reading, of); compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carry, return); compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carry, of); compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carried.arm, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionHumanArmCarry.carry.plain.
 */
export namespace IAutoMovieMotionHumanArmClearance {
  /**
   * An arm's joint angles: `[flexion, abduction, twist]` of the upper arm,
   * the lower arm and the hand, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three members, their order and unit.
   * @evidence contracts/development/design.md#principled-representation The clinical triples a pose holds for the three joints of an arm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all written into the pose `room` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No side and no bone name: the functions that read it take the side.
   */
  export interface IArm {
    /** The upper arm's angles. */
    upper: readonly [number, number, number];

    /** The lower arm's angles. */
    lower: readonly [number, number, number];

    /** The hand's angles. */
    hand: readonly [number, number, number];
  }

  /**
   * What each reading of `room` may keep: the forearm's needed room and the
   * arm's segments by the tangle audit, degrees. Each is measured against
   * its own value in a reference posture, since one reading's slack is not
   * room for the other.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two members, their unit and why they are apart.
   * @evidence contracts/development/design.md#principled-representation One allowance per reading, so a thick flank that the hanging forearm already touches lends no depth to the fingers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by `room`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No combined slack.
   */
  export interface IBaseline {
    /** The forearm's needed room `overshoot` reads, degrees. */
    forearm: number;

    /** The arm's segments' depth the tangle audit reads, degrees. */
    segments: number;
  }
}
