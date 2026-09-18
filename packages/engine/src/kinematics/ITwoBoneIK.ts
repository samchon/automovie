/**
 * The analytic solution for a two-bone chain reaching a goal.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-reachability Encodes the bounded analytic result for a measured two-link chain.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Returns the bounded analytic result consumed by chain lowering.
 */
export interface ITwoBoneIK {
  /**
   * Interior angle at the mid joint (knee / elbow), degrees. `180` = straight,
   * smaller = more bent.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-reachability Measures the mid-joint angle required by the reachable distance.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Carries the law-of-cosines bend selected for the chain.
   */
  bend: number;
  /**
   * Angle to lift the upper segment off the straight root→goal line, degrees,
   * so the tip lands on the goal.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-reachability Measures the root-joint lift that places the endpoint on the target radius.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Carries the upper-link correction paired with the mid-joint bend.
   */
  lift: number;
  /**
   * True when the goal was unreachable and the distance was clamped.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-solve-failure Keeps an unreachable target visible instead of presenting shell clamping as an exact solve.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Distinguishes a reach-shell endpoint from an in-range target.
   */
  clamped: boolean;
}

const acosDeg = (x: number): number =>
  (Math.acos(Math.min(1, Math.max(-1, x))) * 180) / Math.PI;
