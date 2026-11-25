/**
 * The room a forearm needs beside its own trunk and beside the other arm.
 *
 * The other arm's room is the far side of the chest's median plane: an elbow
 * crosses it only as far as its wrist's goal does.
 *
 * A hand goal fixes the wrist and leaves the elbow free on a circle. An elbow
 * place whose point is outside the trunk can still run the forearm through it,
 * so the forearm is judged along its whole length: its axis, sampled from the
 * elbow toward the wrist, keeps the forearm's radius from the colliders of the
 * trunk, the neck and the head at the elbow, tapering to the wrist's own
 * clearance at the wrist, where the palm lies on the surface the hand was sent
 * to. The limb fit, which places the legs before the arms, judges the thighs
 * too (`obstacles`); a caller that poses only the trunk judges the trunk alone
 * (`trunk`).
 *
 * An arm that is not fitted to a goal but carried in joint space between two
 * arms has no elbow place to choose and no goal under its wrist; it is read
 * whole (`room`), against another body's colliders too when one stands in its
 * way, and its elbow let out or folded until the forearm asks no more room than
 * the carry's two ends hold (`cleared`).
 */
export namespace IAutoMovieMotionHumanArmClearance {
  /**
   * An arm's joint angles: `[flexion, abduction, twist]` of the upper arm, the
   * lower arm and the hand, degrees.
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
   * arm's segments by the tangle audit, degrees. Each is measured against its
   * own value in a reference posture, since one reading's slack is not room for
   * the other.
   */
  export interface IBaseline {
    /** The forearm's needed room `overshoot` reads, degrees. */
    forearm: number;

    /** The arm's segments' depth the tangle audit reads, degrees. */
    segments: number;
  }
}
