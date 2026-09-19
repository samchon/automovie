import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Why an arm chain cannot be solved by the analytic arm IK.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-solve-failure Records why an analytic reach cannot produce a valid result.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Carries the explicit failure returned for a degenerate arm chain.
 */
export interface IAutoMovieArmChainFault {
  /**
   * Which arm the fault was found on.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-solve-failure Identifies the failed solve side so an author can correct that chain.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Locates the reachability failure on the affected arm.
   */
  side: "left" | "right";

  /**
   * The mid joint whose hinge cannot bend the chain.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-solve-failure Names the joint that makes the constrained solve impossible.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Exposes the chain member responsible for the reachability failure.
   */
  bone: AutoMovieHumanoidBone;

  /**
   * The fault in the engine's own words, phrased so a correction round can act
   * on it: which bone, what is parallel to what, and what that costs.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-solve-failure Explains the residual geometric cause instead of silently clamping the reach.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Provides the actionable failure reason required when the bounded solve cannot proceed.
   */
  reason: string;
}
