/**
 * The tangle audit's skin, apart from the audit's model so that a module
 * the model itself depends on (the posture resolver, the arm planner) can
 * read it at load without a cycle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the constant is and why it stands alone.
 * @evidence contracts/development/design.md#principled-representation One constant with one owner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The skin, read by `AutoMovieMotionHumanAuditTangleModel` and the arm planner's terms.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The value is the audit's; it is not restated.
 */
export namespace AutoMovieMotionHumanAuditSkin {
  /**
   * The reference overlap beyond which two segments' surfaces are one volume
   * by their build, metres: the 10 mm a pressed skin gives, the audit's own
   * limit for a tangle. Two colliders deeper in each other than that while
   * the body stands at rest cannot be told apart by their corners.
   */
  export const BUILT: number = 0.01;
}
