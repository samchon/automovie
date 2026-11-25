/**
 * The tangle audit's skin, apart from the audit's model so that a module the
 * model itself depends on (the posture resolver, the arm planner) can read it
 * at load without a cycle.
 */
export namespace AutoMovieMotionHumanAuditSkin {
  /**
   * The reference overlap beyond which two segments' surfaces are one volume by
   * their build, metres: the 10 mm a pressed skin gives, the audit's own limit
   * for a tangle. Two colliders deeper in each other than that while the body
   * stands at rest cannot be told apart by their corners.
   */
  export const BUILT: number = 0.01;
}
